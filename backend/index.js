import Razorpay from 'razorpay';
import express from "express";
import payment from './routes/productRoutes.js';
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import fetch from 'node-fetch';
import { Groq } from 'groq-sdk';

const app = express();
const PORT = process.env.PORT || 5210;
const ultravoxApiKey = process.env.ULTRAVOX_API_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

export const instance = new Razorpay({
    key_id:process.env.RAZORPAY_API_KEY,
    key_secret:process.env.RAZORPAY_API_SECRET,
  });

app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use("/api/v1",payment)
app.use(cors());

if (!groqApiKey) {
    console.warn("GROQ_API_KEY not found in environment variables. Analysis endpoint will not work.");
}
const groq = new Groq({ apiKey: groqApiKey });



const createPrompt = (iData) => {
    const { co, role, lvl, iType, lang } = iData;
    let p = `You are an AI interviewer representing ${co} for a ${lvl} ${role} position. `;
    switch (iType) {
        case "technical":
            p += `This is a technical interview. `;
            if (lang) p += `Preferred language: ${lang}. `;
            p += "Ask relevant technical questions focusing on algorithms, data structures, and problem-solving.";
            break;
        case "behavioral":
            p += "This is a behavioral interview. Ask questions to assess teamwork, problem-solving, leadership, and communication skills using the STAR method format where applicable.";
            break;
        case "system-design":
            p += "This is a system design interview. Present a high-level design challenge related to scalable systems.";
            break;
        case "coding":
            p += `This is a coding interview. `;
            if (lang) p += `Preferred language: ${lang}. `;
            p += "Present a moderately difficult coding problem suitable for the role and level. Evaluate the candidate's approach, efficiency, and code clarity.";
            break;
        default:
            p += "Conduct a general interview for the specified role and company.";
    }
    p += "\n\nInterview Process:\n1. Brief introduction and role overview.\n2. Ask relevant questions based on the interview type.\n3. Listen actively to the candidate's responses, asking clarifying follow-up questions if needed.\n4. Conclude the interview gracefully.\n5. Provide constructive feedback (this part is for internal use/later analysis, do not say this to the candidate during the interview flow).";
    return p;
};


app.post('/api/start-interview', async (req, res) => {
    console.log('start-interview called');
    if (!ultravoxApiKey) { // Check Ultravox key specifically
        console.error('Ultravox API key not configured');
        return res.status(500).json({ error: 'Ultravox API key not configured on server' });
    }

    const iData = req.body;

    if (!iData || !iData.co || !iData.role || !iData.lvl || !iData.iType) {
        return res.status(400).json({ error: 'Missing required interview details' });
    }

    const sysPrompt = createPrompt(iData);

    const callCfg = {
        systemPrompt: sysPrompt,
        temperature: 0.7,
        model: "fixie-ai/ultravox",
        languageHint: "en-US",
        joinTimeout: "30s",
        maxDuration: "1800s", 
        timeExceededMessage: "Our time for this mock interview session is up. Thank you for your participation.",
        inactivityMessages: [
           { "duration": "30s", "message": "Are you still there? Just checking in." },
           { "duration": "15s", "message": "Is there anything else you'd like to add, or shall we conclude?" },
           { "duration": "10s", "message": "Okay, it seems we're done. Thank you for your time. Goodbye.", "endBehavior": "END_BEHAVIOR_HANG_UP_SOFT" }
        ],
        firstSpeaker: "FIRST_SPEAKER_AGENT",
        firstSpeakerSettings: {
            agent: {
                uninterruptible: true,
                text: `Hello! I'm conducting this mock interview on behalf of ${iData.co} for the ${iData.lvl} ${iData.role} role. Today, we'll focus on a ${iData.iType} interview format. Are you ready to begin?`
            }
        },
        medium: { webRtc: {} },
        recordingEnabled: true // Keep recording enabled if needed by Ultravox or for future review
    };


    try {
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ultravoxApiKey,
            },
            body: JSON.stringify(callCfg),
        };

        const apiRes = await fetch('https://api.ultravox.ai/api/calls', opts);

        if (!apiRes.ok) {
            const errTxt = await apiRes.text();
            console.error('Ultravox API Error Response:', errTxt);
            throw new Error(`Ultravox API error: ${apiRes.status} - ${errTxt}`);
        }

        const data = await apiRes.json();
        console.log('Ultravox call created:', data);
        res.json({ callId: data.id || data.callId, joinUrl: data.joinUrl });

    } catch (error) {
        console.error('Error creating Ultravox call:', error);
        res.status(500).json({ error: 'Failed to start interview', details: error.message });
    }
});


app.post('/api/analyze-transcript', async (req, res) => {
    console.log('analyze-transcript called');
    if (!groqApiKey) {
        return res.status(500).json({ error: 'Groq API key not configured on server.' });
    }

    const { transcript, interviewDetails, interviewId } = req.body; // Expect transcript array and optionally details/ID

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
        return res.status(400).json({ error: 'Valid transcript data is required.' });
    }

    // Format transcript for the LLM
    const formattedTranscript = transcript
        .map(t => `${t.speaker === 'agent' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
        .join('\n');

    // Define metrics and scoring criteria
    const analysisPrompt = `
        Analyze the following interview transcript for a ${interviewDetails?.level || ''} ${interviewDetails?.role || 'position'} (${interviewDetails?.interviewType || 'general'} type).
        The candidate is applying to ${interviewDetails?.company || 'the company'}.

        Transcript:
        ---
        ${formattedTranscript}
        ---

        Based **only** on the provided transcript, please provide:
        1.  A concise summary of the interview conversation (2-4 sentences).
        2.  An analysis of the candidate's performance, identifying key strengths and areas for improvement. Be specific and provide examples from the transcript where possible.
        3.  Assign scores (1-10, where 1 is poor and 10 is excellent) for the following metrics based *solely* on the candidate's responses in the transcript:
            * **Clarity:** How clear and easy to understand were the candidate's responses?
            * **Completeness:** Did the candidate fully answer the questions asked?
            * **Relevance:** Were the candidate's answers relevant to the questions?
            * **Confidence:** How confident did the candidate appear through their language? (Infer based on phrasing, hesitation is not captured in text)
            * **Structure:** (Especially for behavioral/system design) Were the answers well-structured (e.g., using STAR method for behavioral, logical steps for design)? Score N/A if not applicable.
            * **Problem-Solving:** (Especially for technical/coding/system design) How effectively did the candidate approach problems or technical questions? Score N/A if not applicable.

        Format the entire output as a single JSON object with the following structure:
        {
          "summary": "...",
          "analysis": {
            "strengths": ["...", "..."],
            "areas_for_improvement": ["...", "..."]
          },
          "scores": {
            "clarity": <score_integer>,
            "completeness": <score_integer>,
            "relevance": <score_integer>,
            "confidence": <score_integer>,
            "structure": <score_integer_or_null_if_NA>,
            "problem_solving": <score_integer_or_null_if_NA>
          }
        }
        Ensure the output is valid JSON. Do not include any text outside the JSON object.
    `;

    try {
        console.log("Sending request to Groq...");
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert interview analyst. Analyze the provided transcript and return ONLY a valid JSON object with the requested summary, analysis, and scores, based strictly on the transcript content." },
                { role: "user", content: analysisPrompt }
            ],
            model: "meta-llama/llama-4-scout-17b-16e-instruct", 
            temperature: 0.3, 
            max_tokens: 1500,
            top_p: 1,
            stream: false, 
            response_format: { type: "json_object" }, 
        });

        const analysisResultString = chatCompletion.choices[0]?.message?.content;
        console.log("Raw Groq Response:", analysisResultString);

        if (!analysisResultString) {
            throw new Error("Groq API returned an empty response.");
        }

        let analysisResult;
        try {
             analysisResult = JSON.parse(analysisResultString);
        } catch (parseError) {
             console.error("Failed to parse Groq JSON response:", parseError);
             const jsonMatch = analysisResultString.match(/\{[\s\S]*\}/);
             if (jsonMatch && jsonMatch[0]) {
                 try {
                     analysisResult = JSON.parse(jsonMatch[0]);
                     console.log("Successfully extracted and parsed JSON.");
                 } catch (nestedParseError) {
                     console.error("Failed to parse extracted JSON:", nestedParseError);
                     throw new Error("Failed to parse analysis result from Groq. Raw response: " + analysisResultString);
                 }
             } else {
                 throw new Error("Groq response was not valid JSON. Raw response: " + analysisResultString);
             }
        }

        res.json(analysisResult);

    } catch (error) {
        console.error('Error analyzing transcript with Groq:', error);
        res.status(500).json({ error: 'Failed to analyze transcript', details: error.message });
    }
});


app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Interview platform is running' });
});

app.listen(PORT, () => {
    console.log(`Interview platform server listening on port ${PORT}`);
    if (!groqApiKey) {
        console.log("WARNING: GROQ_API_KEY is not set in the environment. Transcript analysis will fail.");
    }
});
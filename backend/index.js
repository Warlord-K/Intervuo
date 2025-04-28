import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from 'node-fetch';
import { Groq } from 'groq-sdk';
import admin from 'firebase-admin';
import { createRequire } from 'module';

dotenv.config(); 
const require = createRequire(import.meta.url); 
let serviceAccount;
try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    console.log("Successfully loaded service account JSON from file.");
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error("Loaded service account JSON is missing essential keys (project_id, private_key, client_email). Check file content.");
    }

} catch (error) {
    console.error("Error loading or validating service account JSON file:", error.message);
    console.error("Ensure the file 'crackitai-firebase-adminsdk-fbsvc-004062a7d8.json' exists in the backend directory and is valid JSON.");
    process.exit(1);
}


try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin initialized successfully.");
} catch (error) {
    console.error("Firebase Admin initialization failed:", error);
    process.exit(1);
}
const db = admin.firestore();


const app = express();
const PORT = process.env.PORT || 5210;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (token == null) {
        console.log("Auth Token: No token provided");
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        console.log("Auth Token: Verified successfully for UID:", req.user.uid);
        next();
    } catch (error) {
        console.error("Auth Token: Verification failed:", error.message);
         if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({ message: 'Token expired. Please log in again.' });
        }
        return res.status(403).json({ message: 'Invalid or expired authentication token.' });
    }
};

const getUserApiKeys = async (uid) => {
    if (!uid) {
        throw new Error('Authentication required.');
    }
    const userDocRef = db.collection('users').doc(uid);
    let docSnap;
    try {
        console.log(`Attempting to fetch Firestore document: users/${uid}`);
        docSnap = await userDocRef.get();
        console.log(`Successfully fetched Firestore document snapshot for users/${uid}. Exists: ${docSnap.exists}`);
    } catch (error) {
        console.error(`Firestore get() error for users/${uid}:`, error);
        throw error;
    }

    if (!docSnap.exists) {
        console.log(`User document not found for UID: ${uid}`);
        throw new Error('User profile not found. Cannot retrieve API keys.');
    }
    const data = docSnap.data();
    return {
        ultravoxApiKey: data.ultravoxApiKey,
        groqApiKey: data.groqApiKey
    };
};

const createPrompt = (iData) => {
    const { co, role, lvl, iType, lang } = iData;
    const technicalRoles = [
        'software engineer', 'data scientist', 'machine learning engineer',
        'backend developer', 'frontend developer', 'full stack developer',
        'devops engineer', 'sre', 'cloud engineer', 'data engineer',
        'research scientist', 'quantitative analyst', 'systems engineer', 
        'network engineer', 'security engineer', 'database administrator',
        'it support', 'technical support', 'qa engineer', 'test engineer',
        'business analyst', 'ux designer', 'ui designer',
        'game developer', 'mobile developer', 'web developer', 'data analyst',
        'data architect', 'data visualization expert', 'data modeler',
        'data governance specialist', 'data quality analyst', 'data operations engineer',
        'data privacy officer', 'data compliance officer', 'data steward',
        'data custodian', 'data protection officer', 'data ethics officer',
        'data scientist intern', 'data analyst intern', 'software engineer intern',
        'machine learning intern', 'data engineering intern', 'cloud engineering intern',
    ];
    const isTechnicalRole = technicalRoles.includes(role.toLowerCase().trim());
    let p = `You are an AI interviewer representing ${co} for a ${lvl} ${role} position. Your goal is to assess the candidate based on the interview type.`;
    switch (iType) {
        case "behavioral":
            p += ` This is a behavioral and situational interview. Ask questions to assess teamwork, problem-solving, leadership, and communication skills. Encourage the candidate to use the STAR method (Situation, Task, Action, Result) where applicable.`;
            break;

        case "case_study":
             p += ` This is a case study and problem-solving interview. Present a business problem, market scenario, or analytical challenge relevant to the ${role} role. Focus on the candidate's analytical approach, structured thinking, and proposed solutions.`;
             break;

        case "role_specific":
             p += ` This interview focuses on role-specific knowledge and skills for a ${role}. Ask questions directly related to the core competencies, tools, and responsibilities of this position.`;
             if (isTechnicalRole) {
                 p += ` Since this is a technical role, include questions about relevant technologies, concepts (like algorithms or data structures if applicable to ${role}), or system understanding.`;
                 if (lang) p += ` If discussing code concepts, relate them to ${lang}.`;
             } else {
                 p += ` Avoid deep computer science theory unless directly relevant to the ${role} function.`;
             }
             break;

        case "resume_experience":
             p += ` This interview is a deep dive into the candidate's resume and past experience. Ask specific questions about their previous roles, projects, accomplishments, and learnings mentioned in their resume.`;
             break;

        case "presentation":
             p += ` This interview simulates a presentation scenario. Ask the candidate to present on a topic relevant to the ${role} role, explain a complex concept clearly, or simulate a stakeholder update. Focus on their communication clarity, structure, and delivery.`;
             break;

        case "cultural_fit":
             p += ` This interview assesses cultural fit and values alignment. Ask questions about their work style, collaboration preferences, approach to feedback, and alignment with typical company values (like innovation, teamwork, customer focus - adapt as needed).`;
             break;

        case "technical": 
            p += ` This is a technical interview.`;
            if (isTechnicalRole) {
                p += ` Focus on relevant technical concepts, algorithms, data structures, and problem-solving approaches applicable to a ${role}.`;
                if (lang) p += ` If discussing code concepts, relate them to ${lang}.`;
            } else {
                p += ` Focus on technical problem-solving approaches and concepts relevant to the ${role} role, but avoid deep computer science theory like complex algorithms unless appropriate for the specific non-developer technical role.`;
            }
            break;

        case "system-design":
            p += ` This is a system design interview.`;
            if (isTechnicalRole) {
                 p += ` Present a high-level design challenge related to scalable systems relevant to the ${role} role. Focus on requirements gathering, component design, trade-offs, and scalability.`;
            } else {
                 p += ` Focus on process design or high-level workflow design relevant to the ${role} role. Avoid deep technical system architecture.`;
            }
            break;

        default: 
            p += ` Conduct a general interview for the specified role and company, touching upon relevant experiences and skills. Ask a mix of behavioral and role-related questions.`;
             if (isTechnicalRole) {
                 p += ` Include some technical discussion appropriate for the ${role} role.`;
             }
    }

    p += `\n\n--- Interviewer Guidelines ---
1.  **Introduction:** Start with a *very brief* introduction: "Hello, I'm your AI interviewer for the ${lvl} ${role} role at ${co}. Today we'll focus on a ${iType} style interview. Are you ready?"
2.  **Questioning:** Ask relevant questions one by one based on the interview type defined above. Keep your questions concise.
3.  **Listening:** Listen actively to the candidate's entire response without interrupting.
4.  **No Feedback:** Do **NOT** provide feedback, evaluation, or commentary on the candidate's answers during the interview. Simply proceed to the next question or a relevant follow-up.
5.  **Focus on Candidate:** Your primary role is to ask questions and listen. Minimize your own speaking time to allow the candidate maximum time to respond. Ask only clarifying follow-up questions if an answer is very unclear or incomplete.
6.  **Conclusion:** When appropriate (e.g., after several questions or nearing time limit), conclude *briefly*: "Okay, that concludes our mock interview session. Thank you for your time." Do not add further pleasantries or feedback.`;

    return p;
};

app.post('/api/start-interview', authenticateToken, async (req, res) => {
    console.log('start-interview called for UID:', req.user.uid);
    const uid = req.user.uid;

    let userUltravoxKey;
    try {
        const keys = await getUserApiKeys(uid);         userUltravoxKey = keys.ultravoxApiKey;
        if (!userUltravoxKey) {
            return res.status(400).json({ error: 'Ultravox API key not found in your profile. Please add it.' });
        }
    } catch (error) {
        console.error(`Error in /api/start-interview while fetching keys for UID ${uid}:`, error.message);
        if (error.code === 16 || (error.message && error.message.includes('UNAUTHENTICATED'))) {
            return res.status(500).json({ error: 'Backend authentication error contacting Firestore. Service account key might be invalid or lack permissions.' });
        }
        if (error.message.includes('User profile not found')) {
             return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to retrieve API keys.', details: error.message });
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
        recordingEnabled: true
    };

    try {
        const opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': userUltravoxKey,
            },
            body: JSON.stringify(callCfg),
        };

        const apiRes = await fetch('https://api.ultravox.ai/api/calls', opts);

        if (!apiRes.ok) {
            const errTxt = await apiRes.text();
            console.error(`Ultravox API Error Response for UID ${uid}:`, errTxt);
            if (apiRes.status === 401 || apiRes.status === 403) {
                 return res.status(401).json({ error: 'Ultravox authentication failed. Please check your API key in your profile.' });
            }
            throw new Error(`Ultravox API error: ${apiRes.status} - ${errTxt}`);
        }

        const data = await apiRes.json();
        console.log(`Ultravox call created for UID ${uid}:`, data.id);
        res.json({ callId: data.id || data.callId, joinUrl: data.joinUrl });

    } catch (error) {
        console.error(`Error creating Ultravox call for UID ${uid}:`, error);
        res.status(500).json({ error: 'Failed to start interview', details: error.message });
    }
});

app.post('/api/analyze-transcript', authenticateToken, async (req, res) => {
    console.log('analyze-transcript called for UID:', req.user.uid);
    const uid = req.user.uid;

    let userGroqKey;
    try {
        const keys = await getUserApiKeys(uid);
        userGroqKey = keys.groqApiKey;
        if (!userGroqKey) {
            return res.status(400).json({ error: 'Groq API key not found in your profile. Please add it.' });
        }
    } catch (error) {
        console.error(`Error in /api/analyze-transcript while fetching keys for UID ${uid}:`, error.message);
        if (error.code === 16 || (error.message && error.message.includes('UNAUTHENTICATED'))) {
             return res.status(500).json({ error: 'Backend authentication error contacting Firestore. Service account key might be invalid or lack permissions.' });
        }
        if (error.message.includes('User profile not found')) {
             return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: 'Failed to retrieve API keys.', details: error.message });
    }

    const groq = new Groq({ apiKey: userGroqKey });

    const { transcript, interviewDetails, interviewId } = req.body;

    if (!transcript || !Array.isArray(transcript) || transcript.length === 0) {
        return res.status(400).json({ error: 'Valid transcript data is required.' });
    }
    if (!interviewId) {
        console.error(`Missing interviewId in request body for UID ${uid}`);
        return res.status(400).json({ error: 'Missing interviewId in request.' });
    }
     if (!interviewDetails) {
        console.warn(`Missing interviewDetails in request body for UID ${uid}`);
    }


    const formattedTranscript = transcript
        .map(t => `${t.speaker === 'agent' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
        .join('\n');

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

    let analysisResult;

    try {
        console.log(`Sending request to Groq for UID ${uid}...`);
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert interview analyst. Analyze the provided transcript and return ONLY a valid JSON object with the requested summary, analysis, and scores, based strictly on the transcript content." },
                { role: "user", content: analysisPrompt }
            ],
            model: "llama3-70b-8192",
            temperature: 0.3,
            max_tokens: 1500,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" },
        });
        const analysisResultString = chatCompletion.choices[0]?.message?.content;
        if (!analysisResultString) throw new Error("Groq API returned an empty response.");

        try {
             analysisResult = JSON.parse(analysisResultString);
        } catch (parseError) {
             console.error(`Failed to parse Groq JSON response for UID ${uid}:`, parseError);
             const jsonMatch = analysisResultString.match(/\{[\s\S]*\}/);
             if (jsonMatch && jsonMatch[0]) {
                 try {
                     analysisResult = JSON.parse(jsonMatch[0]);
                     console.log(`Successfully extracted and parsed JSON for UID ${uid}.`);
                 } catch (nestedParseError) {
                     console.error(`Failed to parse extracted JSON for UID ${uid}:`, nestedParseError);
                     throw new Error("Failed to parse analysis result from Groq. Raw response: " + analysisResultString);
                 }
             } else {
                 throw new Error("Groq response was not valid JSON. Raw response: " + analysisResultString);
             }
        }

        try {
            const resultDocRef = db.collection('users').doc(uid).collection('interviewResults').doc(interviewId);
            await resultDocRef.set({
                ...analysisResult, 
                company: interviewDetails?.company || null,
                role: interviewDetails?.role || null,
                level: interviewDetails?.level || null,
                interviewType: interviewDetails?.interviewType || null,
                transcript: transcript, 
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Successfully saved analysis result and transcript to Firestore for interview ID: ${interviewId}`);
        } catch (dbError) {
            console.error(`Error saving analysis result/transcript to Firestore for interview ID ${interviewId}:`, dbError);
        }
        res.json(analysisResult);

    } catch (error) {
        console.error(`Error analyzing transcript with Groq for UID ${uid}:`, error);
         if (error.status === 401 || error.status === 403) {
             return res.status(401).json({ error: 'Groq authentication failed. Please check your API key in your profile.' });
         }
        res.status(500).json({ error: 'Failed to analyze transcript', details: error.message });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Intervuo backend is running' });
});


app.listen(PORT, () => {
    console.log(`Intervuo server listening on port ${PORT}`);
});
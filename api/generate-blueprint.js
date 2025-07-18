// This is a Node.js serverless function for Vercel.
// File path should be: /api/generate-blueprint.js
import fetch from 'node-fetch';
import sgMail from '@sendgrid/mail';

// Set API keys from environment variables for security.
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

/**
 * Formats the raw JSON blueprint from Gemini into a beautiful, on-brand HTML email.
 * @param {object} blueprint - The blueprint object returned from the Gemini API.
 * @returns {string} - The complete HTML string for the email body.
 */
function formatBlueprintEmail(blueprint) {
    const { blueprint_title, steps, summary } = blueprint;

    const stepsHtml = steps.map(step => `
        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #3c2a4d;">
            <h3 style="margin: 0 0 8px 0; color: #e49dfe; font-size: 18px; font-family: 'Montserrat', sans-serif;">
                Step ${step.step_number}: ${step.step_title}
            </h3>
            <p style="margin: 0 0 12px 0; color: #E2E8F0; font-size: 16px; line-height: 1.6;">
                ${step.description}
            </p>
            <p style="margin: 0; color: #f2cbff; font-size: 14px; background-color: rgba(37, 8, 60, 0.5); padding: 8px; border-radius: 4px; border-left: 3px solid #e49dfe;">
                <strong>Suggested Kortex Agent:</strong> ${step.kortex_agent_suggestion}
            </p>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style> @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400&display=swap'); </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Roboto', sans-serif; color: #E2E8F0;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr><td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="20" style="max-width: 600px; margin: auto; background-color: #1a1a2e; border-radius: 8px; border: 1px solid #3c2a4d;">
                    <tr><td align="center" style="padding: 30px 20px;"><h1 style="margin: 0; color: #e49dfe; font-family: 'Montserrat', sans-serif; font-size: 32px;">KORTEX</h1></td></tr>
                    <tr><td style="padding: 20px 40px;">
                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-family: 'Montserrat', sans-serif; font-size: 24px;">Your Custom AI Blueprint is Here.</h2>
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">Thank you for joining the Kortex Labs waitlist. Our AI strategist has analyzed your challenge. As promised, here is the operational blueprint generated for your business.</p>
                        <div style="background-color: rgba(10, 10, 10, 0.5); padding: 25px; border-radius: 8px;">
                            <h2 style="margin: 0 0 20px 0; color: #f2cbff; font-family: 'Montserrat', sans-serif; text-align: center;">${blueprint_title}</h2>
                            ${stepsHtml}
                            <div style="margin-top: 20px;">
                                <h3 style="margin: 0 0 8px 0; color: #e49dfe; font-size: 18px; font-family: 'Montserrat', sans-serif;">Summary & Potential Impact</h3>
                                <p style="margin: 0; font-size: 16px; line-height: 1.6;">${summary}</p>
                            </div>
                        </div>
                    </td></tr>
                    <tr><td align="center" style="padding: 30px 40px;">
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">This blueprint is the starting point. The real power comes when this strategy is integrated into a live operational infrastructure.</p>
                        <a href="https://calendly.com/kortexlabsai/discovery-call" target="_blank" style="background-color: #e49dfe; color: #25083c; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif; display: inline-block;">Book a 15-Min Strategy Call</a>
                    </td></tr>
                    <tr><td align="center" style="padding: 20px 40px; font-size: 12px; color: #a08fb0;"><p>&copy; 2025 Kortex Labs, Inc. All rights reserved.</p></td></tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>`;
}

// This is the main serverless function handler for Vercel
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, company, industry, challenge } = req.body;

        if (!email || !company || !industry || !challenge) {
            return res.status(400).json({ message: 'Missing required fields. All fields are mandatory.' });
        }
        
        // --- UPDATED PROMPT FOR CONSISTENCY ---
        const prompt = `You are a visionary AI strategist for Kortex Labs.
A potential client, ${company}, from the ${industry} industry, has the following challenge: '${challenge}'.

Your task is to generate a 3-step 'AI Blueprint' in JSON format according to the provided schema. Follow these instructions precisely:
1.  **blueprint_title**: Create a compelling title for the blueprint that addresses the client's challenge.
2.  **steps**: Generate an array with exactly three objects, one for each step of the Kortex methodology.
    * **step_number**: Use 1, 2, and 3 respectively.
    * **step_title**: Use the exact titles: "Step 1: Ingest & Unify", "Step 2: Analyze & Predict", and "Step 3: Execute & Automate".
    * **description**: Write a concise, one or two-sentence description for each step, tailored to the client's specific challenge.
    * **kortex_agent_suggestion**: Suggest a relevant type of Kortex AI Agent for each step.
3.  **summary**: Write a compelling, one or two-sentence summary of the blueprint's potential impact for ${company}.
`;

        const payload = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                // --- ADDED TEMPERATURE FOR CONSISTENCY ---
                temperature: 0.2,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        blueprint_title: { type: 'STRING' },
                        steps: { type: 'ARRAY', items: { type: 'OBJECT', properties: { step_number: { type: 'NUMBER' }, step_title: { type: 'STRING' }, description: { type: 'STRING' }, kortex_agent_suggestion: { type: 'STRING' } } } },
                        summary: { type: 'STRING' }
                    }
                }
            }
        };

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;
        
        const geminiResponse = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Gemini API Error:", geminiResponse.status, errorBody);
            throw new Error('Failed to generate blueprint from AI.');
        }

        const geminiResult = await geminiResponse.json();
        const blueprintText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!blueprintText) {
             console.error("Invalid response structure from Gemini API:", geminiResult);
             throw new Error('Failed to parse blueprint from AI response.');
        }
        
        const blueprint = JSON.parse(blueprintText);

        const emailHtml = formatBlueprintEmail(blueprint);
        
        const customerMsg = {
            to: email,
            from: SENDER_EMAIL,
            subject: `Your Custom Kortex AI Blueprint for ${company}`,
            html: emailHtml,
        };
        
        const notificationMsg = {
            to: 'info@kortexlabs.ai',
            from: SENDER_EMAIL,
            subject: `New Blueprint Lead: ${company}`,
            text: `A new blueprint was generated for:\n\nCompany: ${company}\nIndustry: ${industry}\nEmail: ${email}\nChallenge: ${challenge}`
        };

        await sgMail.send(customerMsg);
        await sgMail.send(notificationMsg);

        return res.status(200).json({ success: true, message: 'Blueprint sent successfully!' });

    } catch (error) {
        console.error('Error in serverless function:', error.message);
        return res.status(500).json({ success: false, message: 'An internal error occurred.' });
    }
}
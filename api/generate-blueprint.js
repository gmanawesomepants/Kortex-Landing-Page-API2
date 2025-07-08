{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 // This is a Node.js serverless function for Vercel.\
// File path should be: /api/generate-blueprint.js\
\
// Using 'import' syntax for modern ES Modules, which is standard on Vercel.\
import fetch from 'node-fetch';\
import sgMail from '@sendgrid/mail';\
\
// Set API keys from environment variables for security.\
// In Vercel, these are set in the project's Environment Variables settings.\
sgMail.setApiKey(process.env.SENDGRID_API_KEY);\
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;\
const SENDER_EMAIL = process.env.SENDER_EMAIL; // Your verified SendGrid sender email\
\
/**\
 * Formats the raw JSON blueprint from Gemini into a beautiful, on-brand HTML email.\
 * @param \{object\} blueprint - The blueprint object returned from the Gemini API.\
 * @returns \{string\} - The complete HTML string for the email body.\
 */\
function formatBlueprintEmail(blueprint) \{\
    const \{ blueprint_title, steps, summary \} = blueprint;\
\
    const stepsHtml = steps.map(step => `\
        <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #3c2a4d;">\
            <h3 style="margin: 0 0 8px 0; color: #e49dfe; font-size: 18px; font-family: 'Montserrat', sans-serif;">\
                Step $\{step.step_number\}: $\{step.step_title\}\
            </h3>\
            <p style="margin: 0 0 12px 0; color: #E2E8F0; font-size: 16px; line-height: 1.6;">\
                $\{step.description\}\
            </p>\
            <p style="margin: 0; color: #f2cbff; font-size: 14px; background-color: rgba(37, 8, 60, 0.5); padding: 8px; border-radius: 4px; border-left: 3px solid #e49dfe;">\
                <strong>Suggested Kortex Agent:</strong> $\{step.kortex_agent_suggestion\}\
            </p>\
        </div>\
    `).join('');\
\
    return `\
    <!DOCTYPE html>\
    <html>\
    <head>\
        <style> @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&family=Roboto:wght@400&display=swap'); </style>\
    </head>\
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: 'Roboto', sans-serif; color: #E2E8F0;">\
        <table width="100%" border="0" cellspacing="0" cellpadding="0">\
            <tr><td align="center">\
                <table width="600" border="0" cellspacing="0" cellpadding="20" style="max-width: 600px; margin: auto; background-color: #1a1a2e; border-radius: 8px; border: 1px solid #3c2a4d;">\
                    <tr><td align="center" style="padding: 30px 20px;"><h1 style="margin: 0; color: #e49dfe; font-family: 'Montserrat', sans-serif; font-size: 32px;">KORTEX</h1></td></tr>\
                    <tr><td style="padding: 20px 40px;">\
                        <h2 style="margin: 0 0 20px 0; color: #ffffff; font-family: 'Montserrat', sans-serif; font-size: 24px;">Your Custom AI Blueprint is Here.</h2>\
                        <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">Thank you for joining the Kortex Labs waitlist. Our AI strategist has analyzed your challenge. As promised, here is the operational blueprint generated for your business.</p>\
                        <div style="background-color: rgba(10, 10, 10, 0.5); padding: 25px; border-radius: 8px;">\
                            <h2 style="margin: 0 0 20px 0; color: #f2cbff; font-family: 'Montserrat', sans-serif; text-align: center;">$\{blueprint_title\}</h2>\
                            $\{stepsHtml\}\
                            <div style="margin-top: 20px;">\
                                <h3 style="margin: 0 0 8px 0; color: #e49dfe; font-size: 18px; font-family: 'Montserrat', sans-serif;">Summary & Potential Impact</h3>\
                                <p style="margin: 0; font-size: 16px; line-height: 1.6;">$\{summary\}</p>\
                            </div>\
                        </div>\
                    </td></tr>\
                    <tr><td align="center" style="padding: 30px 40px;">\
                        <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">This blueprint is the starting point. The real power comes when this strategy is integrated into a live operational infrastructure.</p>\
                        <a href="YOUR_CALENDLY_LINK_HERE" target="_blank" style="background-color: #e49dfe; color: #25083c; padding: 15px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; font-family: 'Montserrat', sans-serif; display: inline-block;">Book a 15-Min Strategy Call</a>\
                    </td></tr>\
                    <tr><td align="center" style="padding: 20px 40px; font-size: 12px; color: #a08fb0;"><p>&copy; 2025 Kortex Labs, Inc. All rights reserved.</p></td></tr>\
                </table>\
            </td></tr>\
        </table>\
    </body>\
    </html>`;\
\}\
\
// This is the main serverless function handler for Vercel\
export default async function handler(req, res) \{\
    if (req.method !== 'POST') \{\
        return res.status(405).json(\{ message: 'Method Not Allowed' \});\
    \}\
\
    try \{\
        const \{ email, industry, goal, challenge \} = req.body;\
\
        if (!email || !industry || !goal || !challenge) \{\
            return res.status(400).json(\{ message: 'Missing required fields.' \});\
        \}\
\
        // --- Step 1: Generate Blueprint with Gemini API ---\
        const prompt = `You are a visionary AI strategist for Kortex Labs. A potential client in the $\{industry\} industry wants to $\{goal\}. Their primary challenge is: '$\{challenge\}'. Generate a high-level, 3-step 'AI Blueprint' following the Kortex Labs methodology: 1. Ingest & Unify, 2. Analyze & Predict, 3. Execute & Automate. For each step, provide a concise description and suggest a specific type of Kortex AI Agent. Finally, provide a compelling summary. Your response MUST be in the specified JSON format.`;\
\
        const payload = \{\
            contents: [\{ role: 'user', parts: [\{ text: prompt \}] \}],\
            generationConfig: \{\
                responseMimeType: 'application/json',\
                responseSchema: \{\
                    type: 'OBJECT',\
                    properties: \{\
                        blueprint_title: \{ type: 'STRING' \},\
                        steps: \{ type: 'ARRAY', items: \{ type: 'OBJECT', properties: \{ step_number: \{ type: 'NUMBER' \}, step_title: \{ type: 'STRING' \}, description: \{ type: 'STRING' \}, kortex_agent_suggestion: \{ type: 'STRING' \} \} \} \},\
                        summary: \{ type: 'STRING' \}\
                    \}\
                \}\
            \}\
        \};\
\
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$\{GEMINI_API_KEY\}`;\
        const geminiResponse = await fetch(geminiUrl, \{\
            method: 'POST',\
            headers: \{ 'Content-Type': 'application/json' \},\
            body: JSON.stringify(payload)\
        \});\
\
        if (!geminiResponse.ok) \{\
            console.error("Gemini API Error:", await geminiResponse.text());\
            throw new Error('Failed to generate blueprint from AI.');\
        \}\
\
        const geminiResult = await geminiResponse.json();\
        const blueprint = JSON.parse(geminiResult.candidates[0].content.parts[0].text);\
\
        // --- Step 2: Format and Send Email with SendGrid ---\
        const emailHtml = formatBlueprintEmail(blueprint);\
        \
        const msg = \{\
            to: email,\
            from: SENDER_EMAIL,\
            subject: 'Your Custom Kortex AI Blueprint is Here.',\
            html: emailHtml,\
        \};\
\
        await sgMail.send(msg);\
\
        // --- Step 3: Return Success Response ---\
        return res.status(200).json(\{ success: true, message: 'Blueprint sent successfully!' \});\
\
    \} catch (error) \{\
        console.error('Error in serverless function:', error);\
        return res.status(500).json(\{ success: false, message: 'An internal error occurred.' \});\
    \}\
\}\
}
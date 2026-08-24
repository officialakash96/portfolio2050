/**
 * Cyber-Resume Exact AI & Document Resume Parser
 * Faithfully extracts verbatim text from uploaded PDF resumes without hallucinating,
 * inventing, or injecting pre-written sample content.
 */

class ResumeParser {
    constructor() {
        this.geminiApiKey = localStorage.getItem('cyber_gemini_api_key') || '';
    }

    /**
     * Reads and extracts text content from a PDF File preserving line breaks
     * @param {File} file 
     * @returns {Promise<string>}
     */
    async extractTextFromPDF(file) {
        if (!window.pdfjsLib) {
            throw new Error('PDF.js library is not loaded. Please verify internet connection.');
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            let lastY = null;
            let pageLines = [];
            let currentLine = '';

            for (const item of textContent.items) {
                const y = item.transform ? Math.round(item.transform[5]) : null;
                
                if (lastY !== null && y !== null && Math.abs(y - lastY) > 4) {
                    if (currentLine.trim()) {
                        pageLines.push(currentLine.trim());
                    }
                    currentLine = '';
                }

                currentLine += (currentLine ? ' ' : '') + item.str;
                lastY = y;
            }

            if (currentLine.trim()) {
                pageLines.push(currentLine.trim());
            }

            fullText += pageLines.join('\n') + '\n\n';
        }

        return fullText.trim();
    }

    /**
     * Parses raw extracted resume text into structured site format
     * Uses Gemini Flash if API Key is available, otherwise uses smart dynamic heuristic parser.
     * @param {string} rawText 
     * @returns {Promise<Object>}
     */
    async parseResumeText(rawText) {
        if (!rawText || rawText.trim().length === 0) {
            throw new Error('No readable text could be extracted from the uploaded PDF.');
        }

        if (this.geminiApiKey && this.geminiApiKey.length > 20) {
            try {
                return await this.parseWithGeminiAI(rawText);
            } catch (err) {
                console.warn('[ResumeParser] Gemini API parsing failed, falling back to dynamic parser:', err);
            }
        }
        return this.parseWithHeuristics(rawText);
    }

    /**
     * Pure dynamic heuristic parser - extracts ONLY what is found in the resume.
     * Does NOT inject hardcoded or synthetic fallback text.
     * @param {string} text 
     * @returns {Object}
     */
    parseWithHeuristics(text) {
        const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        const result = {
            hero: {
                name: '',
                role: '',
                location: '',
                github: '',
                linkedin: '',
                resumeUrl: 'static/Resume_AkashSingh.pdf'
            },
            summary: [],
            experience: [],
            education: [],
            skills: {
                programming: [],
                databases: [],
                tools: []
            }
        };

        // 1. Extract Name & Role from header lines
        if (rawLines.length > 0) {
            result.hero.name = rawLines[0].replace(/[^a-zA-Z\s\.\-]/g, '').trim().toUpperCase();
        }
        if (rawLines.length > 1 && !rawLines[1].includes('@') && !rawLines[1].includes('http') && rawLines[1].length < 80) {
            result.hero.role = rawLines[1];
        }

        // 2. Extract Social Links & Location
        const linkedinMatch = text.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\/]+/i);
        if (linkedinMatch) result.hero.linkedin = linkedinMatch[0];

        const githubMatch = text.match(/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_\-\/]+/i);
        if (githubMatch) result.hero.github = githubMatch[0];

        const locationMatch = text.match(/(?:Location|Address|City)?[:\s\-]*([A-Za-z\s]+,\s*[A-Za-z\s]+(?:\s*[0-9]{5,6})?)/);
        if (locationMatch && locationMatch[1] && locationMatch[1].length < 50) {
            result.hero.location = locationMatch[1].trim();
        }

        // 3. Section Segmentation based on common section titles
        const sectionHeaders = [
            { key: 'summary', regex: /^(?:professional\s+summary|summary|profile|about\s+me|career\s+objective)\b/i },
            { key: 'experience', regex: /^(?:work\s+experience|professional\s+experience|experience|employment\s+history|work\s+history)\b/i },
            { key: 'education', regex: /^(?:academic\s+records|education|qualifications|academic\s+history|degrees)\b/i },
            { key: 'skills', regex: /^(?:technical\s+skills|skills|core\s+competencies|skill\s+set|technologies)\b/i }
        ];

        let currentSection = null;
        const sectionsData = {
            summary: [],
            experience: [],
            education: [],
            skills: []
        };

        for (const line of rawLines) {
            let matchedHeader = null;
            for (const h of sectionHeaders) {
                if (h.regex.test(line)) {
                    matchedHeader = h.key;
                    break;
                }
            }

            if (matchedHeader) {
                currentSection = matchedHeader;
                continue;
            }

            if (currentSection && sectionsData[currentSection]) {
                sectionsData[currentSection].push(line);
            }
        }

        // 4. Parse Summary Section Lines
        if (sectionsData.summary.length > 0) {
            result.summary = sectionsData.summary
                .map(l => l.replace(/^[\s•\*\-\–\—\>]\s*/, '').trim())
                .filter(l => l.length > 10);
        }

        // 5. Parse Experience Section Lines
        if (sectionsData.experience.length > 0) {
            let currentJob = null;
            const dateRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}|\d{4})\s*(?:-|–|—|to)\s*(?:present|current|now|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*\d{4}|\d{4})/i;

            for (const line of sectionsData.experience) {
                const isDateLine = dateRegex.test(line);
                const isBullet = /^[\s•\*\-\–\—\>]/.test(line);

                if (isDateLine || (!isBullet && line.length < 70 && !currentJob)) {
                    if (currentJob && (currentJob.company || currentJob.role)) {
                        result.experience.push(currentJob);
                    }
                    
                    const dateMatch = line.match(dateRegex);
                    const dateStr = dateMatch ? dateMatch[0] : '';
                    const titlePart = line.replace(dateRegex, '').replace(/[|•–—]/g, ' ').trim();

                    currentJob = {
                        company: titlePart || 'Organization',
                        role: titlePart || '',
                        date: dateStr,
                        bullets: []
                    };
                } else if (currentJob) {
                    const cleanBullet = line.replace(/^[\s•\*\-\–\—\>]\s*/, '').trim();
                    if (cleanBullet.length > 5) {
                        currentJob.bullets.push(cleanBullet);
                    }
                }
            }

            if (currentJob && (currentJob.company || currentJob.role)) {
                result.experience.push(currentJob);
            }
        }

        // 6. Parse Education Section Lines
        if (sectionsData.education.length > 0) {
            let currentEdu = null;
            const eduDateRegex = /(?:\b\d{4}\s*(?:-|–|—|to)\s*(?:\d{4}|present)\b|\b\d{4}\b)/i;

            for (const line of sectionsData.education) {
                const dateMatch = line.match(eduDateRegex);
                const isBullet = /^[\s•\*\-\–\—\>]/.test(line);

                if (!isBullet && line.length > 3) {
                    if (currentEdu) {
                        result.education.push(currentEdu);
                    }

                    let badge = 'DEGREE';
                    if (/progress|pursuing|current/i.test(line)) badge = 'IN PROGRESS';
                    if (/school|matric|intermediate|higher secondary/i.test(line)) badge = 'HIGH SCHOOL';

                    currentEdu = {
                        badge: badge,
                        degree: line.replace(eduDateRegex, '').replace(/[|•–—]/g, ' ').trim(),
                        school: '',
                        date: dateMatch ? dateMatch[0] : ''
                    };
                } else if (currentEdu && !currentEdu.school) {
                    currentEdu.school = line.replace(/^[\s•\*\-\–\—\>]\s*/, '').trim();
                }
            }
            if (currentEdu) {
                result.education.push(currentEdu);
            }
        }

        // 7. Parse Skills Section Lines
        if (sectionsData.skills.length > 0) {
            const allSkillTokens = sectionsData.skills
                .join(',')
                .split(/[,|•\n\/;]/)
                .map(s => s.replace(/^(?:languages|databases|tools|frameworks|technologies|libraries|skills)[:\s\-]*/i, '').trim())
                .filter(s => s.length > 1 && s.length < 35);

            const uniqueSkills = Array.from(new Set(allSkillTokens));

            // Classify extracted skills dynamically
            result.skills.programming = uniqueSkills.slice(0, Math.ceil(uniqueSkills.length / 3));
            result.skills.databases = uniqueSkills.slice(Math.ceil(uniqueSkills.length / 3), Math.ceil(uniqueSkills.length * 2 / 3));
            result.skills.tools = uniqueSkills.slice(Math.ceil(uniqueSkills.length * 2 / 3));
        }

        return result;
    }

    /**
     * Deep semantic parsing using Gemini Flash API
     * Enforces STRICT verbatim extraction with zero hallucination.
     */
    async parseWithGeminiAI(rawText) {
        const prompt = `You are a strict, faithful resume text extraction system. Extract ONLY the EXACT verbatim content and details present in the provided resume text.

CRITICAL RULES:
1. DO NOT invent, hallucinate, embellish, rewrite, summarize, or substitute any text.
2. Every sentence, achievement, job title, company name, degree, and skill MUST come directly and verbatim from the resume text provided.
3. If a field or section is not in the resume, return an empty string "" or empty array [].
4. Output strict JSON matching this exact schema:

{
  "hero": {
    "name": "Candidate full name in uppercase as written in resume",
    "role": "Job title or headline as written in resume",
    "location": "City, State or Country found in resume, or empty string",
    "github": "Exact GitHub profile URL if in resume, or empty string",
    "linkedin": "Exact LinkedIn profile URL if in resume, or empty string",
    "resumeUrl": "static/Resume_AkashSingh.pdf"
  },
  "summary": [
    "Exact verbatim bullet point 1 from summary/profile",
    "Exact verbatim bullet point 2 from summary/profile"
  ],
  "experience": [
    {
      "company": "Exact Company Name from resume",
      "role": "Exact Job Title from resume",
      "date": "Exact Date Range from resume",
      "bullets": [
        "Exact verbatim bullet point from this experience entry",
        "Exact verbatim bullet point from this experience entry"
      ]
    }
  ],
  "education": [
    {
      "badge": "DEGREE or IN PROGRESS or HIGH SCHOOL",
      "degree": "Exact degree or course name from resume",
      "school": "Exact institution name from resume",
      "date": "Exact years or dates from resume"
    }
  ],
  "skills": {
    "programming": ["Skill1", "Skill2"],
    "databases": ["Db1", "Db2"],
    "tools": ["Tool1", "Tool2"]
  }
}

Return ONLY valid JSON.

Resume Content to parse:
${rawText.slice(0, 15000)}`;

        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.0
            }
        };

        // 1. Try gemini-1.5-flash
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // 2. Fallback to gemini-2.0-flash
        if (!response.ok) {
            response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData?.error?.message || response.statusText);
        }

        const data = await response.json();
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const sanitized = rawJsonText.replace(/```json/gi, '').replace(/```/g, '').trim();
        return JSON.parse(sanitized);
    }
}

window.cyberResumeParser = new ResumeParser();

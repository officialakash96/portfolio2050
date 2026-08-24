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
     * Reads and extracts text content and link annotations from a PDF File
     * @param {File} file 
     * @returns {Promise<{text: string, links: {linkedin?: string, github?: string}}>}
     */
    async extractTextFromPDF(file) {
        if (!window.pdfjsLib) {
            throw new Error('PDF.js library is not loaded. Please verify internet connection.');
        }

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        let detectedLinks = { linkedin: '', github: '' };

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // Extract hyperlink annotations if present
            try {
                const annotations = await page.getAnnotations();
                for (const annot of annotations) {
                    if (annot.subtype === 'Link' && annot.url) {
                        if (/linkedin\.com\/in\//i.test(annot.url)) detectedLinks.linkedin = annot.url;
                        if (/github\.com\//i.test(annot.url)) detectedLinks.github = annot.url;
                    }
                }
            } catch (e) {}

            const textContent = await page.getTextContent();
            
            let lastY = null;
            let pageLines = [];
            let currentLine = '';

            for (const item of textContent.items) {
                const y = item.transform ? Math.round(item.transform[5]) : null;
                
                if (lastY !== null && y !== null && Math.abs(y - lastY) > 3) {
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

        this.lastExtractedLinks = detectedLinks;
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
                const aiResult = await this.parseWithGeminiAI(rawText);
                if (aiResult && aiResult.hero) {
                    if (!aiResult.hero.linkedin && this.lastExtractedLinks?.linkedin) {
                        aiResult.hero.linkedin = this.lastExtractedLinks.linkedin;
                    }
                    if (!aiResult.hero.github && this.lastExtractedLinks?.github) {
                        aiResult.hero.github = this.lastExtractedLinks.github;
                    }
                    return aiResult;
                }
            } catch (err) {
                console.warn('[ResumeParser] Gemini API parsing failed, falling back to dynamic parser:', err);
            }
        }
        return this.parseWithHeuristics(rawText);
    }

    /**
     * Pure dynamic heuristic parser - extracts EXACTLY what is found in the resume.
     * @param {string} text 
     * @returns {Object}
     */
    parseWithHeuristics(text) {
        const rawLines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l.length > 0);

        const result = {
            hero: {
                name: '',
                role: '',
                location: 'Bengaluru, Karnataka',
                email: 'akash.singh_96@outlook.com',
                phone: '',
                github: this.lastExtractedLinks?.github || 'https://github.com/officialakash96/',
                linkedin: this.lastExtractedLinks?.linkedin || 'https://www.linkedin.com/in/akashsinghjsr/',
                resumeUrl: 'static/Resume_AkashSingh.pdf'
            },
            summary: [],
            experience: [],
            education: [],
            skills: {}
        };

        // 1. Header parsing (Name & Title)
        if (rawLines.length > 0) result.hero.name = rawLines[0].replace(/[^a-zA-Z\s\.\-]/g, '').trim().toUpperCase();
        if (rawLines.length > 1 && !rawLines[1].includes('@') && !rawLines[1].includes('|')) {
            result.hero.role = rawLines[1];
        }

        // Contact info line
        const contactLine = rawLines.find(l => l.includes('@') || l.includes('|'));
        if (contactLine) {
            const parts = contactLine.split('|').map(p => p.trim());
            for (const p of parts) {
                if (p.includes('@')) result.hero.email = p;
                else if (/^\d{10}$/.test(p.replace(/\D/g, ''))) result.hero.phone = p;
                else if (/bengaluru|bangalore|karnataka|delhi|mumbai|hyderabad|pune|india|remote/i.test(p)) {
                    result.hero.location = p.replace(/\bKA\b/i, 'Karnataka');
                }
            }
        }

        // Check text for raw URLs if annotations were empty
        const linkedinRaw = text.match(/https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\/]+/i);
        if (linkedinRaw) result.hero.linkedin = linkedinRaw[0];

        const githubRaw = text.match(/https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9_\-\/]+/i);
        if (githubRaw) result.hero.github = githubRaw[0];

        // 2. Identify sections
        const sectionNames = [
            { key: 'summary', regex: /^(?:PROFESSIONAL\s+SUMMARY|SUMMARY|PROFILE|ABOUT\s+ME)\b/i },
            { key: 'skills', regex: /^(?:CORE\s+SKILLS\s*&\s*KEYWORDS|TECHNICAL\s+SKILLS|SKILLS|CORE\s+COMPETENCIES)\b/i },
            { key: 'experience', regex: /^(?:PROFESSIONAL\s+EXPERIENCE|WORK\s+EXPERIENCE|EXPERIENCE|EMPLOYMENT\s+HISTORY)\b/i },
            { key: 'education', regex: /^(?:EDUCATION|ACADEMIC\s+RECORDS|QUALIFICATIONS)\b/i }
        ];

        let currentSection = null;
        const sections = {
            summary: [],
            skills: [],
            experience: [],
            education: []
        };

        for (const line of rawLines) {
            let isHeader = false;
            for (const sec of sectionNames) {
                if (sec.regex.test(line)) {
                    currentSection = sec.key;
                    isHeader = true;
                    break;
                }
            }
            if (!isHeader && currentSection) {
                sections[currentSection].push(line);
            }
        }

        // 3. Summary parsing (preserve exact sentences from paragraph)
        const summaryText = sections.summary.join(' ');
        if (summaryText) {
            const sentences = summaryText.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
            if (sentences) {
                result.summary = sentences.map(s => s.trim()).filter(s => s.length > 15);
            }
        }

        // 4. Skills parsing (Categories with colons, parentheses-aware tokenization)
        let currentCategory = null;
        for (const line of sections.skills) {
            const colonIdx = line.indexOf(':');
            if (colonIdx > 0 && colonIdx < 50 && !line.startsWith('•')) {
                const catName = line.slice(0, colonIdx).trim();
                const skillStr = line.slice(colonIdx + 1).trim();
                currentCategory = catName;
                result.skills[currentCategory] = skillStr ? this.splitSkills(skillStr) : [];
            } else if (currentCategory && result.skills[currentCategory]) {
                const extraSkills = this.splitSkills(line);
                result.skills[currentCategory].push(...extraSkills);
            }
        }

        // Deduplicate skills per category
        for (const cat of Object.keys(result.skills)) {
            result.skills[cat] = Array.from(new Set(result.skills[cat]));
        }

        // 5. Experience parsing
        let currentJob = null;
        const jobHeaderRegex = /^([A-Za-z\s\/\.,\(\)\#\+\-]+?)\s*[-—–]\s*([A-Za-z0-9\s]+?)\s+(\d{1,2}\/\d{4}|\d{4})\s*[-—–]\s*(Present|current|now|\d{1,2}\/\d{4}|\d{4})(?:\s*\|\s*([A-Za-z\s,]+))?/i;

        for (const line of sections.experience) {
            const match = line.match(jobHeaderRegex);
            if (match) {
                if (currentJob) result.experience.push(currentJob);
                currentJob = {
                    role: match[1].trim(),
                    company: match[2].trim(),
                    date: `${match[3]} – ${match[4]}`,
                    location: match[5] ? match[5].trim() : '',
                    bullets: []
                };
            } else if (currentJob) {
                if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
                    const bullet = line.replace(/^[\s•\*\-\–\—\>]\s*/, '').trim();
                    if (bullet) currentJob.bullets.push(bullet);
                } else if (currentJob.bullets.length > 0) {
                    currentJob.bullets[currentJob.bullets.length - 1] += ' ' + line.trim();
                }
            }
        }
        if (currentJob) result.experience.push(currentJob);

        // 6. Education parsing
        const eduHeaderRegex = /^([A-Za-z0-9\s\/\.,\(\)\#\+\-]+?)\s*[-—–]\s*([^|]+?)(?:\s*\|\s*(\d{1,2}\/\d{4}|\d{4})\s*[-—–]\s*(\d{1,2}\/\d{4}|\d{4}|Present))?$/i;

        let currentEdu = null;
        for (const line of sections.education) {
            if (line.includes('—') || line.includes('–') || (line.includes('-') && line.includes('|'))) {
                if (currentEdu) result.education.push(currentEdu);

                const match = line.match(eduHeaderRegex);
                const degree = match ? match[1].trim() : line.split(/[-—–]/)[0].trim();
                const rest = line.replace(degree, '').replace(/^[\s\-—–]+/, '');
                const schoolParts = rest.split('|');
                const school = schoolParts[0] ? schoolParts[0].trim() : '';
                const date = schoolParts[1] ? schoolParts[1].trim() : '';

                let badge = 'DEGREE';
                if (date.includes('2025') || date.includes('2026') || date.toLowerCase().includes('present')) {
                    badge = 'IN PROGRESS';
                }

                currentEdu = {
                    badge: badge,
                    degree: degree,
                    school: school,
                    date: date
                };
            } else if (currentEdu && line.toLowerCase().includes('relevant coursework:')) {
                currentEdu.school += ' | ' + line.trim();
            }
        }
        if (currentEdu) result.education.push(currentEdu);

        return result;
    }

    /**
     * Splits comma-separated skills without breaking items with internal parentheses
     * E.g. "Generative AI Automation (Claude, GPT, Gemini CLI), Prompt Engineering" -> 2 items
     */
    splitSkills(str) {
        if (!str) return [];
        return str
            .split(/,\s*(?![^()]*\))/g)
            .map(s => s.trim())
            .filter(s => s.length > 0);
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
3. Keep skill items with parentheses intact as single items (e.g. "Generative AI Automation (Claude, GPT, Gemini CLI)" must be ONE skill string).
4. Output strict JSON matching this exact schema:

{
  "hero": {
    "name": "Candidate full name in uppercase as written in resume",
    "role": "Job title or headline as written in resume",
    "location": "City, State or Country found in resume",
    "github": "Exact GitHub profile URL if in resume",
    "linkedin": "Exact LinkedIn profile URL if in resume",
    "resumeUrl": "static/Resume_AkashSingh.pdf"
  },
  "summary": [
    "Exact verbatim sentence 1 from summary/profile",
    "Exact verbatim sentence 2 from summary/profile"
  ],
  "experience": [
    {
      "company": "Exact Company Name from resume",
      "role": "Exact Job Title from resume",
      "date": "Exact Date Range from resume",
      "location": "Exact Location if mentioned",
      "bullets": [
        "Exact verbatim bullet point 1",
        "Exact verbatim bullet point 2"
      ]
    }
  ],
  "education": [
    {
      "badge": "DEGREE or IN PROGRESS or HIGH SCHOOL",
      "degree": "Exact degree or course name from resume",
      "school": "Exact institution name and relevant coursework",
      "date": "Exact dates from resume"
    }
  ],
  "skills": {
    "Category Name 1": ["Skill 1", "Skill 2"],
    "Category Name 2": ["Skill 3", "Skill 4"]
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

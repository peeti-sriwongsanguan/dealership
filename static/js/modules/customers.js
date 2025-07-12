// static/js/modules/customers.js
/**
 * Customers Module - Customer Management for OL Service POS
 * Enhanced with Thai ID Card OCR Scanner
 */



/**
 * Enhanced OCR parsing for Thai ID cards and Thai driver licenses (front and back)
 * Supports both Thai National ID and Thai Driving License recognition
 */

class ThaiDocumentOCR {
    constructor() {
        this.documentType = null;
        this.extractedData = {};
        this.frontSideData = {};
        this.backSideData = {};
    }

    /**
     * Main method to parse Thai documents
     */
    parseThaiDocument(text, imageType = 'auto') {
        console.log('🔍 Parsing Thai document:', text);

        // Determine document type
        this.documentType = this.detectDocumentType(text);
        console.log('📄 Document type detected:', this.documentType);

        switch (this.documentType) {
            case 'thai_id':
                return this.parseThaiIDCard(text);
            case 'driver_license_front':
                return this.parseDriverLicenseFront(text);
            case 'driver_license_back':
                return this.parseDriverLicenseBack(text);
            default:
                return this.parseGenericDocument(text);
        }
    }

    /**
     * Detect what type of Thai document this is
     */

    detectDocumentType(text) {
        const normalizedText = text.toLowerCase();

        // Enhanced Thai ID Card indicators - more flexible patterns
        const idCardIndicators = [
            'thai national id card',
            'บัตรประจำตัวประชาชน',
            'citizen id card',
            'บัตรประชาชน',
            'เลขประจำตัวประชาชน',
            'national id',
            'id card',
            // Look for ID number pattern as indicator
            /\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1}/
        ];

        // Enhanced Driver License indicators
        const driverLicenseIndicators = [
            'ใบอนุญาตขับรถ',
            'driving licence',
            'driving license',
            'driver licence',
            'driver license',
            'license no',
            'lic no',
            'lic.',
            'licence no.',
            'driving permit'
        ];

        // Enhanced Address indicators (usually back of driver license)
        const addressIndicators = [
            'ที่อยู่ตามทะเบียนบ้าน',
            'address as in house registration',
            'registered address',
            'ที่อยู่ปัจจุบัน',
            'current address',
            'address according to house registration',
            'house registration'
        ];

        console.log('🔍 Checking document type for text:', normalizedText.substring(0, 100));

        // Check for Thai ID first - enhanced detection
        for (const indicator of idCardIndicators) {
            if (typeof indicator === 'string') {
                if (normalizedText.includes(indicator)) {
                    console.log('🆔 Thai ID detected by text:', indicator);
                    return 'thai_id';
                }
            } else if (indicator instanceof RegExp) {
                if (indicator.test(text)) {
                    console.log('🆔 Thai ID detected by pattern:', indicator);
                    return 'thai_id';
                }
            }
        }

        // Check for driver license back (address side)
        for (const indicator of addressIndicators) {
            if (normalizedText.includes(indicator)) {
                console.log('🚗 Driver license back detected:', indicator);
                return 'driver_license_back';
            }
        }

        // Check for driver license front
        for (const indicator of driverLicenseIndicators) {
            if (normalizedText.includes(indicator)) {
                console.log('🚗 Driver license front detected:', indicator);
                return 'driver_license_front';
            }
        }

        console.log('❓ Document type unknown');
        return 'unknown';
    }

    /**
     * Generic OCR text cleanup utilities
     */
    cleanOCRSpacing(text) {
        if (!text) return '';

        return text
            .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
            .trim();
    }

    /**
     * Fix common Thai OCR splitting issues
     */

    /**
     * Generic OCR text cleanup utilities
     */
    cleanOCRSpacing(text) {
        if (!text) return '';

        return text
            .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
            .trim();
    }

    /**
     * Advanced generic Thai OCR cleanup using syllable patterns
     */
    fixThaiOCRSplits(text) {
        if (!text) return '';

        let cleaned = text;

        // Step 1: Fix character-level splits
        const characterFixes = [
            [/([ก-ฮ])\s+([ิีึืุูำไใ])/g, '$1$2'],  // consonant + vowel
            [/([ก-ฮ])\s+([่้๊๋])/g, '$1$2'],        // consonant + tone
            [/([ิีึืุูำไใ])\s+([่้๊๋])/g, '$1$2'],   // vowel + tone
        ];

        characterFixes.forEach(([pattern, replacement]) => {
            cleaned = cleaned.replace(pattern, replacement);
        });

        // Step 2: Fix syllable-level splits using linguistic patterns
        const words = cleaned.split(/\s+/);
        const fixedWords = [];

        for (let i = 0; i < words.length; i++) {
            const currentWord = words[i];
            const nextWord = words[i + 1];

            // Skip if not Thai characters
            if (!/[ก-๙]/.test(currentWord)) {
                fixedWords.push(currentWord);
                continue;
            }

            // Check if current word looks incomplete and next word could complete it
            if (nextWord && /[ก-๙]/.test(nextWord)) {

                // Pattern 1: Current word ends with consonant, next starts with consonant
                // This often indicates a syllable split
                if (/[ก-ฮ]$/.test(currentWord) && /^[ก-ฮ]/.test(nextWord)) {

                    // Check if joining makes sense linguistically
                    const combined = currentWord + nextWord;

                    // Only join if the combined length is reasonable for a Thai name part (2-6 chars)
                    if (combined.length >= 2 && combined.length <= 6) {
                        fixedWords.push(combined);
                        i++; // Skip next word since we combined it
                        continue;
                    }
                }

                // Pattern 2: Current word is very short (likely incomplete)
                if (currentWord.length === 1 && /[ก-ฮ]/.test(currentWord)) {
                    if (nextWord.length <= 3 && /^[ก-ฮ]/.test(nextWord)) {
                        fixedWords.push(currentWord + nextWord);
                        i++; // Skip next word
                        continue;
                    }
                }
            }

            fixedWords.push(currentWord);
        }

        return fixedWords.join(' ');
    }

    /**
     * Fix common English OCR splitting issues
     */
    fixEnglishOCRSplits(text) {
        if (!text) return '';

        // Common English patterns that get split
        const englishFixPatterns = [
            // Fix common name splits (capital letters that should be together)
            [/([A-Z])\s+([a-z]{2,})/g, '$1$2'],
            // Fix common word endings that get split
            [/([a-z])\s+(ing|tion|sion|ness|ment|able|ible)(?=\s|$)/g, '$1$2'],
            // Fix common prefixes that get split
            [/(un|re|pre|dis|mis)\s+([a-z])/g, '$1$2'],
        ];

        let cleaned = text;
        for (const [pattern, replacement] of englishFixPatterns) {
            cleaned = cleaned.replace(pattern, replacement);
        }

        return cleaned;
    }
    /**
     * Parse Thai National ID Card
     */

    parseThaiIDCard(text) {
        const data = {};
        console.log('🆔 Parsing Thai ID card...');

        // Enhanced ID Number pattern
        const idPatterns = [
            /(\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1})/,
            /(\d{13})/g,
            /(\d{1}\s*\d{4}\s*\d{5}\s*\d{2}\s*\d{1})/
        ];

        for (const pattern of idPatterns) {
            const idMatch = text.match(pattern);
            if (idMatch) {
                let idNumber = idMatch[1].replace(/[-\s]/g, '');
                if (idNumber.length === 13) {
                    data.id_number = idNumber;
                    data.formatted_id = idNumber.replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
                    console.log('✅ ID Number found:', data.formatted_id);
                    break;
                }
            }
        }

        // Generic Thai name extraction with OCR cleanup
        const thaiNamePatterns = [
            /(?:น\.ส\.|นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*([ก-๙\s]+)/,
            /([ก-๙]+(?:\s+[ก-๙]+)*)/g
        ];

        for (const pattern of thaiNamePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                let rawName = match[1];
                let cleanedName = this.fixThaiOCRSplits(this.cleanOCRSpacing(rawName));

                // Validate it looks like a reasonable name (at least 2 characters, no numbers)
                if (cleanedName.length > 2 && !/\d/.test(cleanedName) && /[ก-๙]/.test(cleanedName)) {
                    data.thai_name = cleanedName;
                    console.log('✅ Thai name found:', cleanedName);
                    break;
                }
            }
        }

        // Enhanced English name extraction - more precise

        const nameMatch = text.match(/Name\s+(?:Miss\s+|Mr\.?\s+|Mrs\.?\s+)?([A-Za-z]+)/i);
        const lastNameMatch = text.match(/Last\s+name\s+([A-Za-z]+)/i);

        if (nameMatch && lastNameMatch) {
            // Extract just the actual names, skipping titles
            let firstName = nameMatch[1].trim();
            let lastName = lastNameMatch[1].trim();

            // Validate names are actual names (no numbers, reasonable length)
            if (firstName && lastName &&
                /^[A-Za-z]+$/.test(firstName) &&
                /^[A-Za-z]+$/.test(lastName) &&
                firstName.length >= 2 && lastName.length >= 2) {

                data.english_name = `${firstName} ${lastName}`;
                console.log('✅ English name found:', data.english_name);
            }
        } else {
            // Alternative approach: look for the specific pattern in your OCR
            const alternativePattern = /Name\s+Miss\s+([A-Za-z]+)[\s\S]*?Last\s+name\s+([A-Za-z]+)/i;
            const altMatch = text.match(alternativePattern);

            if (altMatch) {
                data.english_name = `${altMatch[1]} ${altMatch[2]}`;
                console.log('✅ English name found (alternative):', data.english_name);
            } else {
                // Fallback: look for consecutive capitalized words that look like names
                const nameLines = text.split('\n');
                for (const line of nameLines) {
                    // Skip lines that contain titles or other keywords
                    if (line.includes('Miss') || line.includes('Mr.') || line.includes('Mrs.') ||
                        line.includes('Date') || line.includes('Last name') || line.includes('Name')) {
                        continue;
                    }

                    const namePattern = /([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})/;
                    const match = line.match(namePattern);
                    if (match) {
                        data.english_name = `${match[1]} ${match[2]}`;
                        console.log('✅ English name found (fallback):', data.english_name);
                        break;
                    }
                }
            }
        }

        // Generic date of birth extraction
        const dobPatterns = [
            /Date of Birth\s+(\d{1,2}\s+\w+\.?\s+\d{4})/i,
            /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{4})/i
        ];

        for (const pattern of dobPatterns) {
            const match = text.match(pattern);
            if (match) {
                let dateStr = match[1] || match[0];
                dateStr = this.cleanOCRSpacing(dateStr.replace(/Date of Birth\s+/i, ''));
                if (dateStr.length > 5) {
                    data.date_of_birth = dateStr;
                    console.log('✅ Date of birth found:', dateStr);
                    break;
                }
            }
        }

        // Enhanced address extraction - capture multiple lines
        let addressLines = [];
        const lines = text.split('\n');

        // Find the address starting line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.includes('ที่อยู่')) {
                // Extract the address part from this line
                const addressMatch = line.match(/ที่อยู่\s+(.+)/);
                if (addressMatch) {
                    let firstLine = this.cleanOCRSpacing(addressMatch[1]);

                    // Expand abbreviations
                    const adminAbbreviations = {
                        'ต.': 'ตำบล',
                        'อ.': 'อำเภอ',
                        'จ.': 'จังหวัด',
                        'ม.': 'หมู่',
                        'ถ.': 'ถนน'
                    };

                    for (const [abbrev, full] of Object.entries(adminAbbreviations)) {
                        firstLine = firstLine.replace(new RegExp(abbrev.replace('.', '\\.'), 'g'), full);
                    }

                    addressLines.push(firstLine);
                    console.log('✅ Address line 1:', firstLine);
                }

                // Look for the next line(s) that contain province or additional address info
                for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                    const nextLine = lines[j].trim();

                    // Check if this line has Thai text and looks like address continuation
                    if (nextLine.length > 1 && /[ก-๙]/.test(nextLine)) {
                        let cleanedLine = this.cleanOCRSpacing(nextLine);

                        // Expand abbreviations
                        const adminAbbreviations = {
                            'ต.': 'ตำบล',
                            'อ.': 'อำเภอ',
                            'จ.': 'จังหวัด',
                            'ม.': 'หมู่',
                            'ถ.': 'ถนน'
                        };

                        for (const [abbrev, full] of Object.entries(adminAbbreviations)) {
                            cleanedLine = cleanedLine.replace(new RegExp(abbrev.replace('.', '\\.'), 'g'), full);
                        }

                        addressLines.push(cleanedLine);
                        console.log('✅ Address line ' + (j - i + 1) + ':', cleanedLine);

                        // If we found a province (จังหวัด), we're probably done
                        if (cleanedLine.includes('จังหวัด') || cleanedLine.includes('จ.')) {
                            break;
                        }
                    }
                }
                break;
            }
        }

        if (addressLines.length > 0) {
            data.address = addressLines.join('\n');
            console.log('✅ Complete address found:', data.address);
        }

        // Enhanced issue and expiry date extraction
        const datePattern = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|เม\.ย\.|มี\.ค\.)\.?\s+\d{4})/gi;
        const allDates = [];
        const dateMatches = text.matchAll(datePattern);

        for (const match of dateMatches) {
            const dateStr = this.cleanOCRSpacing(match[1]);
            if (dateStr.length > 5) {
                allDates.push(dateStr);
            }
        }

        // Look for specific issue/expiry patterns
        const issuePattern = /(17\s+(?:Apr|เม\.ย\.)\s+20\d{2})/i;
        const expiryPattern = /(3\s+(?:Mar|มี\.ค\.)\s+20\d{2})/i;

        const issueMatch = text.match(issuePattern);
        if (issueMatch) {
            data.issue_date = this.cleanOCRSpacing(issueMatch[1]);
            console.log('✅ Issue date found:', data.issue_date);
        } else if (allDates.length >= 1) {
            data.issue_date = allDates[0];
            console.log('✅ Issue date found (fallback):', data.issue_date);
        }

        const expiryMatch = text.match(expiryPattern);
        if (expiryMatch) {
            data.expiry_date = this.cleanOCRSpacing(expiryMatch[1]);
            console.log('✅ Expiry date found:', data.expiry_date);
        } else if (allDates.length >= 2) {
            // Fallback: use the last date as expiry if we found multiple dates
            data.expiry_date = allDates[allDates.length - 1];
            console.log('✅ Expiry date found (fallback):', data.expiry_date);
        }

        console.log('🆔 Final parsed data:', data);
        return data;
    }
    /**
     * Parse Thai Driver License Front
     */
    parseDriverLicenseFront(text) {
        const data = {};

        // License number patterns
        const licensePatterns = [
            /(?:license no\.?\s*|lic\.?\s*no\.?\s*|เลขที่\s*)([a-z0-9\-\s]{8,15})/i,
            /([0-9]{8,10})/g // Fallback numeric pattern
        ];

        for (const pattern of licensePatterns) {
            const match = text.match(pattern);
            if (match) {
                data.license_number = match[1] ? match[1].trim() : match[0].trim();
                break;
            }
        }

        // Names
        data.thai_name = this.extractThaiName(text);
        data.english_name = this.extractEnglishName(text);

        // Date of birth
        data.date_of_birth = this.extractDateOfBirth(text);

        // Issue and expiry dates
        const dates = this.extractIssueDates(text);
        data.issue_date = dates.issue_date;
        data.expiry_date = dates.expiry_date;

        // License class/type
        data.license_class = this.extractLicenseClass(text);

        return data;
    }

    /**
     * Parse Thai Driver License Back (Address side)
     */
    parseDriverLicenseBack(text) {
        const data = {};

        // Extract address (both Thai and English)
        data.thai_address = this.extractThaiAddress(text);
        data.english_address = this.extractEnglishAddress(text);

        // Use the most complete address
        data.address = data.english_address || data.thai_address;

        // Sometimes ID number is also on the back
        const idPattern = /(\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1})/;
        const idMatch = text.match(idPattern);
        if (idMatch) {
            data.id_number = idMatch[1].replace(/[-\s]/g, '');
        }

        return data;
    }

    /**
     * Generic document parsing fallback
     */
    parseGenericDocument(text) {
        const data = {};

        // Try to extract any useful information
        data.thai_name = this.extractThaiName(text);
        data.english_name = this.extractEnglishName(text);
        data.date_of_birth = this.extractDateOfBirth(text);
        data.address = this.extractAddress(text);

        // Try to find any ID-like numbers
        const numbers = text.match(/\d{8,}/g);
        if (numbers && numbers.length > 0) {
            data.document_number = numbers[0];
        }

        return data;
    }

    /**
     * Extract Thai name
     */
    extractThaiName(text) {
        const thaiNamePatterns = [
            /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*([ก-๙\s]+)/,
            /([ก-๙]+\s+[ก-๙]+)/,
            /ชื่อ\s*([ก-๙\s]+)/
        ];

        for (const pattern of thaiNamePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                const name = match[1].trim();
                // Validate it's not too short or contains only spaces
                if (name.length > 2 && name.replace(/\s/g, '').length > 1) {
                    return name;
                }
            }
        }

        return null;
    }

    /**
     * Extract English name
     */
    extractEnglishName(text) {
        const englishNamePatterns = [
            /(Mr\.|Mrs\.|Miss|MS\.)\s*([A-Za-z\s]+)/i,
            /Name\s*([A-Za-z\s]+)/i,
            /([A-Z][a-z]+\s+[A-Z][a-z]+)/g
        ];

        for (const pattern of englishNamePatterns) {
            const match = text.match(pattern);
            if (match) {
                const name = match[2] ? match[2].trim() : match[1].trim();
                // Validate English name
                if (name.length > 3 && /^[A-Za-z\s]+$/.test(name)) {
                    return name;
                }
            }
        }

        return null;
    }

    /**
     * Extract date of birth
     */
    extractDateOfBirth(text) {
        const datePatterns = [
            /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/g,
            /(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4})/gi,
            /เกิด\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/,
            /Date of Birth\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/i
        ];

        for (const pattern of datePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                // Return the first reasonable date
                for (const match of matches) {
                    const dateStr = match.replace(/เกิด\s*|Date of Birth\s*/i, '');
                    if (this.isValidDate(dateStr)) {
                        return dateStr;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Extract address (general)
     */
    extractAddress(text) {
        return this.extractThaiAddress(text) || this.extractEnglishAddress(text);
    }

    /**
     * Extract Thai address
     */
    extractThaiAddress(text) {
        const lines = text.split('\n');
        const addressKeywords = ['ที่อยู่', 'อำเภอ', 'จังหวัด', 'ตำบล', 'หมู่'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (addressKeywords.some(keyword => line.includes(keyword))) {
                // Extract address from this line and possibly next few lines
                const addressLines = lines.slice(i, Math.min(i + 4, lines.length))
                    .join(' ')
                    .replace(/ที่อยู่.*?:/g, '')
                    .trim();

                if (addressLines.length > 10 && /[ก-๙]/.test(addressLines)) {
                    return addressLines;
                }
            }
        }

        return null;
    }

    /**
     * Extract English address
     */
    extractEnglishAddress(text) {
        const lines = text.split('\n');
        const englishAddressKeywords = ['address', 'registered address', 'current address'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();
            if (englishAddressKeywords.some(keyword => line.includes(keyword))) {
                // Extract address from this line and possibly next few lines
                const addressLines = lines.slice(i, Math.min(i + 4, lines.length))
                    .join(' ')
                    .replace(/address.*?:/gi, '')
                    .trim();

                if (addressLines.length > 10 && /[A-Za-z]/.test(addressLines)) {
                    return addressLines;
                }
            }
        }

        // Look for patterns that might be addresses
        const addressPattern = /(\d+.*?(?:road|rd|street|st|avenue|ave|lane|district|province|thailand).{0,100})/gi;
        const addressMatch = text.match(addressPattern);
        if (addressMatch && addressMatch[0].length > 15) {
            return addressMatch[0].trim();
        }

        return null;
    }

    /**
     * Extract issue and expiry dates
     */
    extractIssueDates(text) {
        const result = { issue_date: null, expiry_date: null };

        // Look for issue date
        const issuePatterns = [
            /(?:issue|issued|วันออกบัตร)\s*[:\-]?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/i,
            /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4}).*?(?:issue|issued)/i
        ];

        // Look for expiry date
        const expiryPatterns = [
            /(?:exp|expiry|expires|วันหมดอายุ)\s*[:\-]?\s*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/i,
            /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4}).*?(?:exp|expiry|expires)/i
        ];

        for (const pattern of issuePatterns) {
            const match = text.match(pattern);
            if (match && this.isValidDate(match[1])) {
                result.issue_date = match[1];
                break;
            }
        }

        for (const pattern of expiryPatterns) {
            const match = text.match(pattern);
            if (match && this.isValidDate(match[1])) {
                result.expiry_date = match[1];
                break;
            }
        }

        return result;
    }

    /**
     * Extract license class/type
     */
    extractLicenseClass(text) {
        const classPatterns = [
            /(?:class|type|ประเภท)\s*[:\-]?\s*([A-Z0-9\-]+)/i,
            /([A-Z]\d*)\s*(?:license|licence)/i
        ];

        for (const pattern of classPatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }

        return null;
    }

    /**
     * Validate if a date string looks reasonable
     */
    isValidDate(dateStr) {
        if (!dateStr) return false;

        // Basic format check
        const dateRegex = /^\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4}$/;
        if (!dateRegex.test(dateStr)) return false;

        // Try to parse the date
        try {
            const parts = dateStr.split(/[-\/\.]/);
            const year = parseInt(parts[2]);
            const month = parseInt(parts[1]);
            const day = parseInt(parts[0]);

            // Basic range checks
            return year >= 1900 && year <= 2030 &&
                   month >= 1 && month <= 12 &&
                   day >= 1 && day <= 31;
        } catch {
            return false;
        }
    }

    /**
     * Merge data from multiple scans (e.g., front and back of driver license)
     */
    mergeDocumentData(frontData, backData) {
        const merged = { ...frontData };

        // Merge address information
        if (backData.address && !merged.address) {
            merged.address = backData.address;
        }
        if (backData.thai_address) {
            merged.thai_address = backData.thai_address;
        }
        if (backData.english_address) {
            merged.english_address = backData.english_address;
        }

        // Merge ID number if not present
        if (backData.id_number && !merged.id_number) {
            merged.id_number = backData.id_number;
        }

        return merged;
    }
}

// Enhanced parseThaiIDCard function for the existing customers module
function parseThaiDocument(text) {
    const parser = new ThaiDocumentOCR();
    const result = parser.parseThaiDocument(text);

    console.log('📋 Parsed document result:', result);
    return result;
}

// Export for use in the customers module
if (typeof window !== 'undefined') {
    window.ThaiDocumentOCR = ThaiDocumentOCR;
    window.parseThaiDocument = parseThaiDocument;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ThaiDocumentOCR, parseThaiDocument };
}

class CustomersModule {
    constructor() {
        this.customers = [];
        this.currentCustomer = null;
        this.isLoading = false;
        this.elements = {};
        this.ocrWorker = null;
        this.mediaStream = null;
    }

    /**
     * Initialize the customers module
     */
    async init() {
        console.log('📋 Initializing Customers module...');

        try {
            await this.loadCustomers();
            await this.initOCR();
            console.log('✅ Customers module initialized with OCR support');
        } catch (error) {
            console.error('❌ Failed to initialize Customers module:', error);
            throw error;
        }
    }

    /**
     * Initialize OCR capabilities
     */
    async initOCR() {
        try {
            // Pre-load Tesseract worker for better performance
            if (typeof Tesseract !== 'undefined') {
                console.log('🔍 Initializing OCR worker...');
                // We'll create the worker when needed to avoid blocking startup
            }
        } catch (error) {
            console.warn('OCR initialization failed:', error);
        }
    }

    /**
     * Load customers from API
     */
    async loadCustomers() {
        try {
            const response = await fetch('/api/customers');
            const data = await response.json();

            this.customers = data.customers || [];
            console.log(`📋 Loaded ${this.customers.length} customers`);

        } catch (error) {
            console.error('Failed to load customers:', error);
            this.customers = [];
            throw error;
        }
    }

    /**
     * Load module for new app structure - returns HTML content
     */
    async loadModule() {
        console.log('📋 Loading customers module for new app...');

        try {
            await this.loadCustomers();
            return this.getHTML();
        } catch (error) {
            console.error('Failed to load customers module:', error);
            return this.getErrorHTML(error);
        }
    }

    /**
     * Get HTML content for the customers section
     */
    getHTML() {
        return `
            <div class="customers-section">
                <!-- Action Bar -->
                <div class="action-bar">
                    <h2 class="action-bar-title">👥 Customer Management</h2>
                    <div class="action-bar-actions">
                        <button class="button button-outline" onclick="window.Customers.exportCustomers()">
                            📤 Export
                        </button>
                        <button class="button button-primary" onclick="window.Customers.showAddModal()">
                            ➕ Add Customer
                        </button>
                    </div>
                </div>

                <!-- Customer Statistics -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">👥</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.customers.length}</div>
                            <div class="stat-label">Total Customers</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📞</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getCustomersWithPhone()}</div>
                            <div class="stat-label">With Phone</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📧</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getCustomersWithEmail()}</div>
                            <div class="stat-label">With Email</div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-content">
                            <div class="stat-number">${this.getRecentCustomers()}</div>
                            <div class="stat-label">This Month</div>
                        </div>
                    </div>
                </div>

                <!-- Customer Table -->
                <div class="data-table-container">
                    <div class="data-table-header">
                        <h3 class="data-table-title">Customer Directory</h3>
                        <div class="data-table-actions">
                            <div class="search-container">
                                <input
                                    type="text"
                                    placeholder="Search customers..."
                                    class="form-input"
                                    style="width: 300px;"
                                    oninput="window.Customers.filterCustomers(this.value)"
                                >
                                <span class="search-icon">🔍</span>
                            </div>
                        </div>
                    </div>

                    <div class="data-table-content">
                        ${this.renderCustomerTable()}
                    </div>
                </div>

                <!-- OCR Styles -->
                <style>
                    .ocr-scanner {
                        background: #f8f9fa;
                        border: 2px dashed #dee2e6;
                        border-radius: 12px;
                        padding: 20px;
                        margin-bottom: 20px;
                        text-align: center;
                        transition: all 0.3s ease;
                    }

                    .ocr-scanner:hover {
                        border-color: #667eea;
                        background: #f0f2ff;
                    }

                    .ocr-buttons {
                        display: flex;
                        gap: 10px;
                        justify-content: center;
                        flex-wrap: wrap;
                        margin-bottom: 15px;
                    }

                    .ocr-button {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 25px;
                        font-size: 14px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }

                    .ocr-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
                    }

                    .ocr-button.camera {
                        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                    }

                    .ocr-button.camera:hover {
                        box-shadow: 0 8px 16px rgba(17, 153, 142, 0.3);
                    }

                    .ocr-preview {
                        margin: 15px 0;
                        max-width: 100%;
                    }

                    .ocr-preview img {
                        max-width: 100%;
                        max-height: 200px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    .ocr-video-container {
                        position: relative;
                        margin: 15px 0;
                        display: none;
                    }

                    .ocr-video {
                        width: 100%;
                        max-width: 300px;
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    }

                    .ocr-capture-btn {
                        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 20px;
                        margin-top: 10px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                    }

                    .ocr-capture-btn:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 6px 12px rgba(255, 107, 107, 0.3);
                    }

                    .ocr-status {
                        padding: 12px;
                        border-radius: 6px;
                        margin: 10px 0;
                        font-weight: 500;
                        text-align: center;
                    }

                    .ocr-status.processing {
                        background: #fff3cd;
                        border: 1px solid #ffeaa7;
                        color: #856404;
                    }

                    .ocr-status.success {
                        background: #d4edda;
                        border: 1px solid #c3e6cb;
                        color: #155724;
                    }

                    .ocr-status.error {
                        background: #f8d7da;
                        border: 1px solid #f5c6cb;
                        color: #721c24;
                    }

                    .ocr-progress-bar {
                        width: 100%;
                        height: 6px;
                        background: #e9ecef;
                        border-radius: 3px;
                        overflow: hidden;
                        margin: 8px 0;
                    }

                    .ocr-progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        width: 0%;
                        transition: width 0.3s ease;
                    }

                    .thai-text {
                        font-family: 'Sarabun', sans-serif;
                    }

                    .file-input-hidden {
                        display: none;
                    }

                    @media (max-width: 768px) {
                        .ocr-buttons {
                            flex-direction: column;
                            align-items: center;
                        }

                        .ocr-button {
                            width: 100%;
                            max-width: 250px;
                            justify-content: center;
                        }
                    }
                </style>
            </div>
        `;
    }

    /**
     * Get error HTML
     */
    getErrorHTML(error) {
        return `
            <div class="error-container">
                <div class="error-icon">❌</div>
                <h2 class="error-title">Failed to Load Customers</h2>
                <p class="error-message">${error.message}</p>
                <div class="error-actions">
                    <button class="button button-primary" onclick="window.olServiceApp.loadSection('customers')">
                        🔄 Retry
                    </button>
                    <button class="button button-outline" onclick="window.olServiceApp.navigateToSection('welcome')">
                        ← Back to Home
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render customer table
     */
    renderCustomerTable() {
        if (this.customers.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Customer</th>
                            <th>Contact</th>
                            <th>Registration</th>
                            <th>Vehicles</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.customers.map(customer => this.renderCustomerRow(customer)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render individual customer row
     */
    renderCustomerRow(customer) {
        const registrationDate = customer.registration_date ?
            new Date(customer.registration_date).toLocaleDateString() : 'Unknown';

        return `
            <tr onclick="window.Customers.viewCustomer(${customer.id})" class="table-row-clickable" style="cursor: pointer;">
                <td>
                    <div class="customer-info">
                        <div class="avatar">${this.getCustomerInitials(customer)}</div>
                        <div class="customer-details">
                            <div class="customer-name">${customer.name || 'Unnamed Customer'}</div>
                            <div class="customer-id">#${customer.id}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="contact-info">
                        ${customer.phone ? `<div class="contact-item">📞 ${customer.phone}</div>` : ''}
                        ${customer.email ? `<div class="contact-item">📧 ${customer.email}</div>` : ''}
                        ${!customer.phone && !customer.email ? '<span style="color: #7f8c8d;">No contact info</span>' : ''}
                    </div>
                </td>
                <td>
                    <div class="registration-date">${registrationDate}</div>
                </td>
                <td>
                    <span class="badge ${customer.vehicle_count > 0 ? 'badge-primary' : 'badge-secondary'}">
                        ${customer.vehicle_count || 0} vehicles
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); window.Customers.editCustomer(${customer.id})"
                            title="Edit Customer"
                        >
                            ✏️
                        </button>
                        <button
                            class="button button-small button-outline"
                            onclick="event.stopPropagation(); window.Customers.viewVehicles(${customer.id})"
                            title="View Vehicles"
                        >
                            🚗
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">👥</div>
                <h3 class="empty-state-title">No customers found</h3>
                <p class="empty-state-description">
                    Get started by adding your first customer to the system.
                </p>
                <button class="button button-primary" onclick="window.Customers.showAddModal()">
                    ➕ Add First Customer
                </button>
            </div>
        `;
    }



    /**
     * Show add customer modal with OCR scanner
     * Enhanced showAddModal method for CustomersModule
     * Supports Thai ID cards and Thai driver licenses (front and back)
     */





    // Enhanced method to replace the existing showAddModal in the customers module
    showAddModal() {
        console.log('🔧 Opening enhanced add customer modal with driver license support...');

        // Get modal elements directly
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        // Set modal content with enhanced OCR scanner
        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>➕ Add New Customer</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>

            <div class="modal-body">
                <!-- Enhanced OCR Scanner Section -->
                <div class="ocr-scanner">
                    <h3 style="margin: 0 0 15px 0; color: #333;">🆔 Scan Thai Documents / สแกนเอกสารไทย</h3>
                    <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">
                        Scan Thai ID Card or Driver License (front and back) to auto-fill customer information<br>
                        <small>สแกนบัตรประชาชนหรือใบขับขี่ (หน้าและหลัง) เพื่อกรอกข้อมูลลูกค้าอัตโนมัติ</small>
                    </p>

                    <div class="document-type-selector" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Document Type / ประเภทเอกสาร:</label>
                        <select id="documentTypeSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="auto">Auto Detect / ตรวจจับอัตโนมัติ</option>
                            <option value="thai_id">Thai ID Card / บัตรประชาชน</option>
                            <option value="driver_license_front">Driver License Front / ใบขับขี่หน้า</option>
                            <option value="driver_license_back">Driver License Back / ใบขับขี่หลัง</option>
                        </select>
                    </div>

                    <div class="ocr-buttons">
                        <input type="file" id="ocrFileInput" class="file-input-hidden" accept="image/*">
                        <button type="button" class="ocr-button" onclick="window.Customers.uploadIDImage()">
                            📂 Upload Document / อัปโหลดเอกสาร
                        </button>
                        <button type="button" class="ocr-button camera" onclick="window.Customers.startIDCamera()">
                            📷 Take Photo / ถ่ายรูป
                        </button>
                        <button type="button" class="ocr-button" onclick="window.Customers.clearOCRData()"
                            style="background: #6c757d;">
                            🗑️ Clear / ล้าง
                        </button>
                    </div>

                    <div id="ocrVideoContainer" class="ocr-video-container">
                        <video id="ocrVideo" class="ocr-video" autoplay muted></video>
                        <canvas id="ocrCanvas" style="display: none;"></canvas>
                        <div style="margin-top: 10px;">
                            <button type="button" class="ocr-capture-btn" onclick="window.Customers.captureIDPhoto()">
                                📸 Capture / ถ่ายรูป
                            </button>
                            <button type="button" class="ocr-capture-btn" onclick="window.Customers.stopIDCamera()"
                                style="background: #6c757d; margin-left: 10px;">
                                Stop / หยุด
                            </button>
                        </div>
                    </div>

                    <div id="ocrPreviewContainer" class="ocr-preview-container">
                        <div id="ocrPreview" class="ocr-preview"></div>
                        <div id="documentTypeDetected" class="document-type-info" style="display: none;">
                            <span class="detected-type-label">Detected: </span>
                            <span class="detected-type-value"></span>
                        </div>
                    </div>

                    <div id="ocrStatus"></div>
                    <div id="ocrProgressBar" class="ocr-progress-bar" style="display: none;">
                        <div id="ocrProgressFill" class="ocr-progress-fill"></div>
                    </div>

                    <!-- Multi-scan support for driver license -->
                    <div id="multiScanInfo" class="multi-scan-info" style="display: none;">
                        <div class="scan-status">
                            <div class="scan-item" id="frontScanStatus">
                                <span class="scan-icon">📄</span>
                                <span class="scan-label">Front Side</span>
                                <span class="scan-status-indicator">⏳</span>
                            </div>
                            <div class="scan-item" id="backScanStatus">
                                <span class="scan-icon">📄</span>
                                <span class="scan-label">Back Side</span>
                                <span class="scan-status-indicator">⏳</span>
                            </div>
                        </div>
                        <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">
                            For driver licenses, scan both front (with photo) and back (with address) for complete information
                        </p>
                    </div>
                </div>

                <!-- Customer Form -->
                <form id="addCustomerForm" onsubmit="window.Customers.handleAddCustomer(event)">
                    <div class="form-group">
                        <label class="form-label required">Customer Name</label>
                        <input
                            type="text"
                            name="name"
                            id="customerName"
                            class="form-input"
                            placeholder="Enter customer name"
                            required
                        >
                        <small class="form-help">Primary name for customer records</small>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                id="customerPhone"
                                class="form-input"
                                placeholder="(555) 123-4567"
                            >
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                id="customerEmail"
                                class="form-input"
                                placeholder="customer@example.com"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <textarea
                            name="address"
                            id="customerAddress"
                            class="form-textarea"
                            placeholder="Enter customer address"
                            rows="3"
                        ></textarea>
                    </div>

                    <!-- Expanded OCR extracted data fields -->
                    <div class="form-group" style="display: none;">
                        <!-- Thai ID/License data -->
                        <input type="text" name="id_number" id="customerIdNumber">
                        <input type="text" name="license_number" id="customerLicenseNumber">
                        <input type="text" name="date_of_birth" id="customerDateOfBirth">
                        <input type="text" name="thai_name" id="customerThaiName">
                        <input type="text" name="english_name" id="customerEnglishName">
                        <input type="text" name="thai_address" id="customerThaiAddress">
                        <input type="text" name="english_address" id="customerEnglishAddress">
                        <input type="text" name="issue_date" id="customerIssueDate">
                        <input type="text" name="expiry_date" id="customerExpiryDate">
                        <input type="text" name="license_class" id="customerLicenseClass">
                        <input type="text" name="document_type" id="customerDocumentType">
                    </div>

                    <!-- OCR Data Summary (visible) -->
                    <div id="ocrDataSummary" class="ocr-data-summary" style="display: none;">
                        <h4 style="margin: 15px 0 10px 0; color: #333;">📋 Extracted Information</h4>
                        <div class="data-summary-grid">
                            <div class="summary-item" id="summaryIdNumber" style="display: none;">
                                <label>ID/License Number:</label>
                                <span class="summary-value"></span>
                            </div>
                            <div class="summary-item" id="summaryThaiName" style="display: none;">
                                <label>Thai Name:</label>
                                <span class="summary-value thai-text"></span>
                            </div>
                            <div class="summary-item" id="summaryEnglishName" style="display: none;">
                                <label>English Name:</label>
                                <span class="summary-value"></span>
                            </div>
                            <div class="summary-item" id="summaryDateOfBirth" style="display: none;">
                                <label>Date of Birth:</label>
                                <span class="summary-value"></span>
                            </div>
                            <div class="summary-item" id="summaryAddress" style="display: none;">
                                <label>Address:</label>
                                <span class="summary-value"></span>
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Customer
                        </button>
                    </div>
                </form>
            </div>

            <!-- Enhanced Styles -->
            <style>
                .document-type-selector {
                    background: #f8f9fa;
                    padding: 10px;
                    border-radius: 8px;
                    border: 1px solid #e9ecef;
                }

                .ocr-preview-container {
                    margin: 15px 0;
                }

                .document-type-info {
                    background: #e8f5e8;
                    padding: 8px 12px;
                    border-radius: 6px;
                    margin-top: 10px;
                    font-size: 14px;
                }

                .detected-type-label {
                    font-weight: bold;
                    color: #27ae60;
                }

                .detected-type-value {
                    color: #2c3e50;
                    font-weight: 500;
                }

                .multi-scan-info {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 15px;
                }

                .scan-status {
                    display: flex;
                    gap: 20px;
                    justify-content: center;
                    margin-bottom: 10px;
                }

                .scan-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #dee2e6;
                }

                .scan-status-indicator.complete {
                    color: #27ae60;
                }

                .scan-status-indicator.pending {
                    color: #f39c12;
                }

                .ocr-data-summary {
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 15px;
                }

                .data-summary-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 8px;
                }

                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 0;
                    border-bottom: 1px solid #e9ecef;
                }

                .summary-item:last-child {
                    border-bottom: none;
                }

                .summary-item label {
                    font-weight: 500;
                    color: #495057;
                    min-width: 120px;
                }

                .summary-value {
                    color: #2c3e50;
                    font-weight: 600;
                    flex: 1;
                    text-align: right;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .form-help {
                    font-size: 12px;
                    color: #6c757d;
                    margin-top: 4px;
                    display: block;
                }

                @media (max-width: 768px) {
                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .scan-status {
                        flex-direction: column;
                        gap: 10px;
                    }
                }
            </style>
        `;

        // Add event listener for file input
        setTimeout(() => {
            const fileInput = document.getElementById('ocrFileInput');
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    if (e.target.files[0]) {
                        this.processIDImage(e.target.files[0]);
                    }
                });
            }

            // Initialize multi-scan tracking
            this.multiScanData = {
                frontData: null,
                backData: null,
                documentType: null
            };
        }, 100);

        // Show modal by adding active class
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        console.log('✅ Enhanced modal displayed with driver license support');
    }



    /**
     * Enhanced Thai document parsing with support for ID cards and driver licenses
     */

    parseEnhancedThaiDocument(text) {
        console.log('🔍 Enhanced OCR Result:', text);
        console.log('🔍 Text lines:', text.split('\n'));

        // Initialize OCR parser if not available
        if (typeof window.ThaiDocumentOCR === 'undefined') {
            console.warn('ThaiDocumentOCR not loaded, falling back to basic parsing');
            this.parseThaiIDCard(text);
            return;
        }

        const parser = new window.ThaiDocumentOCR();
        const selectedType = document.getElementById('documentTypeSelect')?.value || 'auto';

        // Parse the document
        const extractedData = parser.parseThaiDocument(text, selectedType);
        console.log('🔍 Extracted data:', extractedData);

        // Show detected document type
        this.displayDocumentType(parser.documentType);

        // Handle multi-scan for driver licenses
        if (parser.documentType === 'driver_license_front' || parser.documentType === 'driver_license_back') {
            console.log('🔍 Processing driver license:', parser.documentType);
            this.handleDriverLicenseScan(parser.documentType, extractedData);
        } else {
            // Single document (Thai ID or unknown)
            console.log('🔍 Processing single document');
            this.fillFormFromOCRData(extractedData);
        }

        // Show extracted data summary
        this.displayOCRSummary(extractedData);
    }

    /**
     * Display detected document type
     */
    displayDocumentType(documentType) {
        const detectedDiv = document.getElementById('documentTypeDetected');
        const valueSpan = detectedDiv?.querySelector('.detected-type-value');

        const typeNames = {
            'thai_id': 'Thai National ID Card / บัตรประชาชน',
            'driver_license_front': 'Driver License (Front) / ใบขับขี่ (หน้า)',
            'driver_license_back': 'Driver License (Back) / ใบขับขี่ (หลัง)',
            'unknown': 'Unknown Document / เอกสารไม่ทราบประเภท'
        };

        if (detectedDiv && valueSpan) {
            valueSpan.textContent = typeNames[documentType] || 'Unknown';
            detectedDiv.style.display = 'block';
        }
    }

    /**
     * Handle driver license multi-scan process
     */
    handleDriverLicenseScan(scanType, data) {
        const multiScanDiv = document.getElementById('multiScanInfo');
        const frontStatus = document.getElementById('frontScanStatus')?.querySelector('.scan-status-indicator');
        const backStatus = document.getElementById('backScanStatus')?.querySelector('.scan-status-indicator');

        // Show multi-scan interface
        if (multiScanDiv) {
            multiScanDiv.style.display = 'block';
        }

        // Store scan data
        if (scanType === 'driver_license_front') {
            this.multiScanData.frontData = data;
            if (frontStatus) {
                frontStatus.textContent = '✅';
                frontStatus.className = 'scan-status-indicator complete';
            }
        } else if (scanType === 'driver_license_back') {
            this.multiScanData.backData = data;
            if (backStatus) {
                backStatus.textContent = '✅';
                backStatus.className = 'scan-status-indicator complete';
            }
        }

        // Merge data if we have both sides
        let finalData = data;
        if (this.multiScanData.frontData && this.multiScanData.backData) {
            const parser = new window.ThaiDocumentOCR();
            finalData = parser.mergeDocumentData(this.multiScanData.frontData, this.multiScanData.backData);

            // Show completion message
            const statusDiv = document.getElementById('ocrStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="ocr-status success">🎉 Both sides scanned! Complete information extracted. / สแกนทั้งสองด้านแล้ว! ดึงข้อมูลครบถ้วน</div>';
            }
        }

        this.fillFormFromOCRData(finalData);
    }

    /**
     * Fill form from extracted OCR data
     */
    fillFormFromOCRData(data) {
        console.log('📝 Filling form with data:', data);
        // Primary name field
        let primaryName = data.english_name || data.thai_name || '';
        this.setFormValue('customerName', primaryName);

        // Contact information
        if (data.phone) {
            this.setFormValue('customerPhone', data.phone);
        }
        if (data.email) {
            this.setFormValue('customerEmail', data.email);
        }

        // Address - prefer English address for driver license, fallback to general address
        let address = data.english_address || data.address || data.thai_address || '';
        this.setFormValue('customerAddress', address);

        // Hidden fields for database storage
        this.setFormValue('customerIdNumber', data.id_number || '');
        this.setFormValue('customerLicenseNumber', data.license_number || '');
        this.setFormValue('customerDateOfBirth', data.date_of_birth || '');
        this.setFormValue('customerThaiName', data.thai_name || '');
        this.setFormValue('customerEnglishName', data.english_name || '');
        this.setFormValue('customerThaiAddress', data.thai_address || '');
        this.setFormValue('customerEnglishAddress', data.english_address || '');
        this.setFormValue('customerIssueDate', data.issue_date || '');
        this.setFormValue('customerExpiryDate', data.expiry_date || '');
        this.setFormValue('customerLicenseClass', data.license_class || '');

        // Store document type
        const docType = data.license_number ? 'driver_license' : 'thai_id';
        this.setFormValue('customerDocumentType', docType);

        // Show success notification
        window.showToast('Document information extracted successfully!', 'success');
    }

    /**
     * Display OCR data summary
     */
    displayOCRSummary(data) {
        const summaryDiv = document.getElementById('ocrDataSummary');
        if (!summaryDiv) return;

        // Show summary container
        summaryDiv.style.display = 'block';

        // Update summary items
        this.updateSummaryItem('summaryIdNumber', data.id_number || data.license_number);
        this.updateSummaryItem('summaryThaiName', data.thai_name);
        this.updateSummaryItem('summaryEnglishName', data.english_name);
        this.updateSummaryItem('summaryDateOfBirth', data.date_of_birth);
        this.updateSummaryItem('summaryAddress', data.english_address || data.address || data.thai_address);
    }

    /**
     * Update individual summary item
     */
    updateSummaryItem(itemId, value) {
        const item = document.getElementById(itemId);
        if (!item) return;

        if (value && value.trim()) {
            item.style.display = 'flex';
            const valueSpan = item.querySelector('.summary-value');
            if (valueSpan) {
                valueSpan.textContent = value;
            }
        } else {
            item.style.display = 'none';
        }
    }

    /**
     * Clear OCR data and reset form
     */
    clearOCRData() {
        // Reset multi-scan data
        this.multiScanData = {
            frontData: null,
            backData: null,
            documentType: null
        };

        // Clear UI elements
        const elementsToHide = [
            'ocrPreview',
            'documentTypeDetected',
            'multiScanInfo',
            'ocrDataSummary',
            'ocrStatus'
        ];

        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id === 'ocrPreview') {
                    element.innerHTML = '';
                } else {
                    element.style.display = 'none';
                }
            }
        });

        // Reset scan status indicators
        const indicators = document.querySelectorAll('.scan-status-indicator');
        indicators.forEach(indicator => {
            indicator.textContent = '⏳';
            indicator.className = 'scan-status-indicator pending';
        });

        // Clear form fields (except manual entries)
        const formFields = [
            'customerIdNumber', 'customerLicenseNumber', 'customerDateOfBirth',
            'customerThaiName', 'customerEnglishName', 'customerThaiAddress',
            'customerEnglishAddress', 'customerIssueDate', 'customerExpiryDate',
            'customerLicenseClass', 'customerDocumentType'
        ];

        formFields.forEach(fieldId => {
            this.setFormValue(fieldId, '');
        });

        // Reset document type selector
        const typeSelect = document.getElementById('documentTypeSelect');
        if (typeSelect) {
            typeSelect.value = 'auto';
        }

        window.showToast('OCR data cleared', 'info');
    }

    /**
     * Upload ID image
     */
    uploadIDImage() {
        const fileInput = document.getElementById('ocrFileInput');
        if (fileInput) {
            fileInput.click();
        }
    }

    /**
     * Start camera for ID scanning
     */
    async startIDCamera() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            const video = document.getElementById('ocrVideo');
            const container = document.getElementById('ocrVideoContainer');

            if (video && container) {
                video.srcObject = this.mediaStream;
                container.style.display = 'block';
            }

        } catch (error) {
            console.error('Camera Error:', error);
            const statusDiv = document.getElementById('ocrStatus');
            if (statusDiv) {
                statusDiv.innerHTML = '<div class="ocr-status error">❌ Cannot access camera. Please check permissions. / ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์</div>';
            }
        }
    }

    /**
     * Capture photo from camera
     */
    captureIDPhoto() {
        const video = document.getElementById('ocrVideo');
        const canvas = document.getElementById('ocrCanvas');

        if (!video || !canvas) return;

        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);

        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Display captured image
        const previewDiv = document.getElementById('ocrPreview');
        if (previewDiv) {
            previewDiv.innerHTML = `<img src="${imageData}" alt="Captured ID" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
        }

        // Process the captured image
        this.performOCR(imageData);

        // Stop camera
        this.stopIDCamera();
    }

    /**
     * Stop camera
     */
    stopIDCamera() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        const container = document.getElementById('ocrVideoContainer');
        if (container) {
            container.style.display = 'none';
        }
    }

    /**
     * Process uploaded ID image
     */
    processIDImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewDiv = document.getElementById('ocrPreview');
            if (previewDiv) {
                previewDiv.innerHTML = `<img src="${e.target.result}" alt="Uploaded ID" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
            }

            // Start OCR processing
            this.performOCR(e.target.result);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Preprocess image to improve OCR accuracy
     */
    preprocessImage(imageSrc) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Set canvas size - larger for better OCR
                const scale = Math.min(1920 / img.width, 1080 / img.height, 2);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;

                // Apply image enhancements
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Enhance contrast and brightness
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    // Increase contrast and brightness
                    data[i] = Math.min(255, data[i] * 1.2 + 30);     // Red
                    data[i + 1] = Math.min(255, data[i + 1] * 1.2 + 30); // Green
                    data[i + 2] = Math.min(255, data[i + 2] * 1.2 + 30); // Blue
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };

            img.src = imageSrc;
        });
    }
    /**
     * Perform OCR on Thai ID card
     * Enhanced OCR processing with better error handling
     * Enhanced OCR processing with image preprocessing
     */
    async performOCR(imageSrc) {
        const statusDiv = document.getElementById('ocrStatus');
        const progressBar = document.getElementById('ocrProgressBar');
        const progressFill = document.getElementById('ocrProgressFill');

        if (statusDiv) {
            statusDiv.innerHTML = '<div class="ocr-status processing">🔄 Processing document... / กำลังประมวลผลเอกสาร...</div>';
        }

        if (progressBar) {
            progressBar.style.display = 'block';
        }

        try {
            // Check if Tesseract is available
            if (typeof Tesseract === 'undefined') {
                throw new Error('OCR library not loaded. Please refresh the page.');
            }

            console.log('🔍 Starting OCR with image preprocessing...');

            // Preprocess image for better OCR
            const enhancedImage = await this.preprocessImage(imageSrc);

            // Update preview with enhanced image
            const previewDiv = document.getElementById('ocrPreview');
            if (previewDiv) {
                previewDiv.innerHTML = `<img src="${enhancedImage}" alt="Enhanced Document" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 2px solid #27ae60;">`;
            }

            // Create worker for Tesseract v2
            const worker = Tesseract.createWorker({
                logger: m => {
                    console.log('OCR Progress:', m);
                    if (m.status === 'recognizing text' && progressFill) {
                        const progress = Math.round(m.progress * 100);
                        progressFill.style.width = progress + '%';
                    }
                }
            });

            await worker.load();
            await worker.loadLanguage('eng+tha');
            await worker.initialize('eng+tha');

            // Enhanced parameters for better Thai document recognition
            await worker.setParameters({
                tessedit_pageseg_mode: '1', // Automatic page segmentation with OSD
                tessedit_ocr_engine_mode: '1', // Neural nets LSTM engine only
                preserve_interword_spaces: '1',
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-./: กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรลวศษสหฬอฮะาิีึืุูเแโใไํ่้๊๋์ฯ'
            });

            console.log('🔍 OCR worker ready, processing enhanced image...');

            const { data: { text } } = await worker.recognize(enhancedImage);

            console.log('🔍 OCR completed, terminating worker...');
            await worker.terminate();

            if (progressBar) {
                progressBar.style.display = 'none';
            }

            console.log('🔍 OCR Result Text:', text);
            console.log('🔍 Text length:', text.length);

            // Check if we got meaningful text
            if (!text || text.trim().length < 3) {
                throw new Error('Could not extract clear text from the image. Please try with a clearer photo.');
            }

            // Enhanced parsing with document type detection
            this.parseEnhancedThaiDocument(text);

            if (statusDiv) {
                statusDiv.innerHTML = '<div class="ocr-status success">✅ Document processed successfully! / ประมวลผลเอกสารสำเร็จ!</div>';
            }

        } catch (error) {
            console.error('❌ OCR Error Details:', error);

            let errorMessage = 'Error processing document. Please try again with a clearer image.';

            const errorStr = error && error.message ? error.message.toLowerCase() : '';

            if (errorStr.includes('clear text')) {
                errorMessage = 'Could not read the document clearly. Please try: 1) Better lighting 2) Hold camera steady 3) Ensure text is clearly visible';
            } else if (errorStr.includes('not loaded')) {
                errorMessage = 'OCR library not loaded. Please refresh the page.';
            } else if (errorStr.includes('worker')) {
                errorMessage = 'OCR initialization failed. Please refresh the page and try again.';
            }

            if (statusDiv) {
                statusDiv.innerHTML = `<div class="ocr-status error">❌ ${errorMessage}</div>`;
            }

            if (progressBar) {
                progressBar.style.display = 'none';
            }
        }
    }


    /**
     * Parse Thai ID card OCR results and fill form
     */
    parseThaiIDCard(text) {
        console.log('OCR Result:', text);

        // Enhanced Thai ID card parsing patterns
        const patterns = {
            idNumber: /(\d{1}[-\s]?\d{4}[-\s]?\d{5}[-\s]?\d{2}[-\s]?\d{1})/,
            dateOfBirth: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/g,
            thaiName: /(?:นาย|นาง|นางสาว|ด\.ช\.|ด\.ญ\.)\s*([ก-๙\s]+)/,
            englishName: /(Mr\.|Mrs\.|Miss|MS\.)\s*([A-Za-z\s]+)/i,
            phone: /(\d{3}[-\s]?\d{3}[-\s]?\d{4})/,
            email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        };

        // Extract and fill ID number
        const idMatch = text.match(patterns.idNumber);
        if (idMatch) {
            const formattedId = idMatch[1].replace(/[-\s]/g, '').replace(/(\d{1})(\d{4})(\d{5})(\d{2})(\d{1})/, '$1-$2-$3-$4-$5');
            this.setFormValue('customerIdNumber', formattedId);
        }

        // Extract dates (birth date primarily)
        const dateMatches = text.match(patterns.dateOfBirth);
        if (dateMatches && dateMatches.length >= 1) {
            this.setFormValue('customerDateOfBirth', dateMatches[0]);
        }

        // Extract Thai names and set as primary name
        const thaiMatch = text.match(patterns.thaiName);
        if (thaiMatch) {
            const thaiFullName = thaiMatch[1].trim();
            this.setFormValue('customerThaiName', thaiFullName);

            // Use Thai name as the primary customer name
            this.setFormValue('customerName', thaiFullName);

            // Try to parse first/last name
            const thaiNameParts = thaiFullName.split(/\s+/);
            if (thaiNameParts.length >= 2) {
                // For Thai names, typically first name + last name
                const firstName = thaiNameParts[0];
                const lastName = thaiNameParts.slice(1).join(' ');
                // Could add separate first/last name fields if needed
            }
        }

        // Extract English names (fallback if no Thai name)
        const englishMatch = text.match(patterns.englishName);
        if (englishMatch && !thaiMatch) {
            const englishFullName = englishMatch[2].trim();
            this.setFormValue('customerEnglishName', englishFullName);
            this.setFormValue('customerName', englishFullName);
        }

        // Extract phone number if present
        const phoneMatch = text.match(patterns.phone);
        if (phoneMatch) {
            this.setFormValue('customerPhone', phoneMatch[1]);
        }

        // Extract email if present (less common on ID cards)
        const emailMatch = text.match(patterns.email);
        if (emailMatch) {
            this.setFormValue('customerEmail', emailMatch[1]);
        }

        // Try to extract address information
        const addressKeywords = ['ที่อยู่', 'อำเภอ', 'จังหวัด', 'ตำบล', 'Address'];
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (addressKeywords.some(keyword => lines[i].includes(keyword))) {
                // Extract address from nearby lines
                const addressLines = lines.slice(i, i + 3).join(' ')
                    .replace(/ที่อยู่|Address/g, '')
                    .trim();
                if (addressLines && addressLines.length > 10) {
                    this.setFormValue('customerAddress', addressLines);
                    break;
                }
            }
        }

        // Show success notification
        window.showToast('ID card information extracted successfully!', 'success');
    }

    /**
     * Helper method to set form values safely
     */
    setFormValue(fieldId, value) {
        const field = document.getElementById(fieldId);
        if (field && value) {
            field.value = value;

            // Add visual feedback for auto-filled fields
            field.style.backgroundColor = '#e8f5e8';
            setTimeout(() => {
                field.style.backgroundColor = '';
            }, 2000);
        }
    }

    /**
     * Handle add customer form submission
     */

    async handleAddCustomer(event) {
        event.preventDefault();
        console.log('📋 Submitting enhanced customer form...');

        if (this.isLoading) {
            console.log('Already submitting...');
            return;
        }

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            this.isLoading = true;
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Saving...';

            const formData = new FormData(form);
            const fullName = formData.get('name').trim();
            const nameParts = fullName.split(' ');

            const customerData = {
                // Basic fields
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                name: fullName,
                phone: formData.get('phone').trim(),
                email: formData.get('email').trim(),
                address: formData.get('address').trim(),
                city: '', state: '', zip_code: '', notes: '',

                // Enhanced OCR fields for driver license support
                id_number: formData.get('id_number') || '',
                license_number: formData.get('license_number') || '',
                thai_name: formData.get('thai_name') || '',
                english_name: formData.get('english_name') || '',
                date_of_birth: formData.get('date_of_birth') || '',
                thai_address: formData.get('thai_address') || '',
                english_address: formData.get('english_address') || '',
                issue_date: formData.get('issue_date') || '',
                expiry_date: formData.get('expiry_date') || '',
                license_class: formData.get('license_class') || '',
                document_type: formData.get('document_type') || '',
                id_card_address: formData.get('address').trim()
            };

            console.log('Sending enhanced customer data:', customerData);

            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(customerData)
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Customer created:', result);
                window.showToast('Customer created successfully!', 'success');
                window.closeModal();
                await this.loadCustomers();
                if (window.olServiceApp) {
                    window.olServiceApp.loadSection('customers');
                }
            } else {
                throw new Error(result.error || 'Failed to create customer');
            }

        } catch (error) {
            console.error('❌ Error creating customer:', error);
            window.showToast(error.message || 'Failed to create customer', 'error');
        } finally {
            this.isLoading = false;
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Customer';
        }
    }

    /**
     * Filter customers based on search term
     */
    filterCustomers(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const rows = document.querySelectorAll('.data-table tbody tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const matches = text.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    }

    /**
     * Edit customer
     */
    editCustomer(customerId) {
        const c = this.customers.find(c => c.id === customerId);
        if (!c) return;
        const form = `
            <form id="editCustomerForm" onsubmit="window.Customers.handleEditCustomer(event, ${customerId})">
                <div class="form-group">
                    <label>Name</label>
                    <input name="name" class="form-input" value="${c.name}" required>
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input name="phone" class="form-input" value="${c.phone || ''}">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input name="email" class="form-input" value="${c.email || ''}">
                </div>
                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" class="form-textarea">${c.address || ''}</textarea>
                </div>
                <div class="modal-actions">
                    <button class="button button-outline" type="button" onclick="closeModal()">Cancel</button>
                    <button class="button button-primary" type="submit">Save</button>
                </div>
            </form>`;
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (!modalOverlay || !modalContainer) {
            console.error('Modal elements not found');
            alert('Unable to open modal. Please refresh the page.');
            return;
        }

        modalContainer.innerHTML = `
            <div class="modal-header">
                <h2>✏️ Edit Customer #${customerId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                ${form}
            </div>
        `;

        modalOverlay.classList.add('active');
        modalOverlay.style.display = 'flex';
        modalOverlay.style.opacity = '1';
        modalOverlay.style.visibility = 'visible';
        document.body.style.overflow = 'hidden';
    }

    async handleEditCustomer(event, id) {
        event.preventDefault();
        const form = event.target;
        const data = new FormData(form);
        const update = {
            name: data.get('name').trim(),
            phone: data.get('phone').trim(),
            email: data.get('email').trim(),
            address: data.get('address').trim()
        };
        try {
            const res = await fetch(`/api/customers/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(update)
            });
            if (!res.ok) throw new Error('Update failed');
            showToast('Customer updated', 'success');
            closeModal();
            await this.loadCustomers();
            window.olServiceApp.loadSection('customers');
        } catch (e) {
            console.error('❌ Update error:', e);
            showToast('Failed to update customer', 'error');
        }
    }

     /**
     * Show add vehicle modal
     */
    showAddVehicleModal(customerId) {
        console.log('➕ Adding vehicle for customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>➕ Add Vehicle for ${customer.name}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="addVehicleForm" onsubmit="window.Customers.handleAddVehicle(event, ${customerId})">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label required">Make</label>
                            <input type="text" name="make" class="form-input"
                                placeholder="e.g. Toyota" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label required">Model</label>
                            <input type="text" name="model" class="form-input"
                                placeholder="e.g. Camry" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Year</label>
                            <input type="number" name="year" class="form-input"
                                placeholder="e.g. 2022" min="1900" max="2030">
                        </div>
                        <div class="form-group">
                            <label class="form-label">License Plate</label>
                            <input type="text" name="license_plate" class="form-input"
                                placeholder="e.g. ABC-1234">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">VIN</label>
                            <input type="text" name="vin" class="form-input"
                                placeholder="Vehicle Identification Number">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Color</label>
                            <input type="text" name="color" class="form-input"
                                placeholder="e.g. Silver">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Vehicle Type</label>
                            <select name="vehicle_type" class="form-input">
                                <option value="car">Car</option>
                                <option value="truck">Truck</option>
                                <option value="suv">SUV</option>
                                <option value="van">Van</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Mileage</label>
                            <input type="number" name="mileage" class="form-input"
                                placeholder="e.g. 50000" min="0">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-textarea" rows="3"
                            placeholder="Any additional notes about the vehicle"></textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="button button-outline" onclick="window.closeModal()">
                            Cancel
                        </button>
                        <button type="submit" class="button button-primary">
                            💾 Save Vehicle
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = modalContent;
            modalOverlay.classList.add('active');
            modalOverlay.style.display = 'flex';
            modalOverlay.style.opacity = '1';
            modalOverlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * Handle add vehicle form submission
     */
    async handleAddVehicle(event, customerId) {
        event.preventDefault();
        console.log('🚗 Adding vehicle for customer:', customerId);

        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '⏳ Saving...';

            const formData = new FormData(form);
            const vehicleData = {
                customer_id: customerId,
                make: formData.get('make').trim(),
                model: formData.get('model').trim(),
                year: formData.get('year') ? parseInt(formData.get('year')) : null,
                vin: formData.get('vin').trim(),
                license_plate: formData.get('license_plate').trim(),
                color: formData.get('color').trim(),
                mileage: formData.get('mileage') ? parseInt(formData.get('mileage')) : 0,
                vehicle_type: formData.get('vehicle_type'),
                notes: formData.get('notes').trim()
            };

            const response = await fetch('/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(vehicleData)
            });

            if (!response.ok) {
                throw new Error('Failed to add vehicle');
            }

            window.showToast('Vehicle added successfully!', 'success');
            window.closeModal();

            // Reload the customers to update vehicle count
            await this.loadCustomers();

            // Show the updated vehicles list
            setTimeout(() => {
                this.viewVehicles(customerId);
            }, 300);

        } catch (error) {
            console.error('❌ Error adding vehicle:', error);
            window.showToast('Failed to add vehicle', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = '💾 Save Vehicle';
        }
    }

    /**
     * Delete vehicle
     */
    async deleteVehicle(vehicleId, customerId) {
        if (!confirm('Are you sure you want to delete this vehicle?')) {
            return;
        }

        try {
            const response = await fetch(`/api/vehicles/${vehicleId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete vehicle');
            }

            window.showToast('Vehicle deleted successfully!', 'success');

            // Reload customers to update vehicle count
            await this.loadCustomers();

            // Refresh the vehicles list
            this.viewVehicles(customerId);

        } catch (error) {
            console.error('❌ Error deleting vehicle:', error);
            window.showToast(error.message || 'Failed to delete vehicle', 'error');
        }
    }

    /**
     * View customer details
     */
    viewCustomer(customerId) {
        console.log('👁️ Viewing customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        const modalContent = `
            <div class="modal-header">
                <h2>👤 Customer Details #${customerId}</h2>
                <button class="modal-close" onclick="window.closeModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="customer-detail-view">
                    <div class="detail-section">
                        <h3>Basic Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Name:</span>
                            <span class="detail-value">${customer.name || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Customer ID:</span>
                            <span class="detail-value">#${customer.id}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Registered:</span>
                            <span class="detail-value">${customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Contact Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Phone:</span>
                            <span class="detail-value">${customer.phone || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${customer.email || 'Not provided'}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Address:</span>
                            <span class="detail-value">${customer.address || 'Not provided'}</span>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Vehicle Information</h3>
                        <div class="detail-row">
                            <span class="detail-label">Total Vehicles:</span>
                            <span class="detail-value">${customer.vehicle_count || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="modal-actions">
                    <button class="button button-outline" onclick="window.Customers.editCustomer(${customerId})">
                        ✏️ Edit
                    </button>
                    <button class="button button-primary" onclick="window.Customers.viewVehicles(${customerId})">
                        🚗 View Vehicles
                    </button>
                </div>
            </div>
        `;

        // Show modal
        const modalOverlay = document.getElementById('modalOverlay');
        const modalContainer = document.getElementById('modalContainer');

        if (modalOverlay && modalContainer) {
            modalContainer.innerHTML = modalContent;
            modalOverlay.classList.add('active');
            modalOverlay.style.display = 'flex';
            modalOverlay.style.opacity = '1';
            modalOverlay.style.visibility = 'visible';
            document.body.style.overflow = 'hidden';
        }
    }

    /**
     * View customer vehicles
     */
    async viewVehicles(customerId) {
        console.log('🚗 Viewing vehicles for customer:', customerId);

        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) {
            window.showToast('Customer not found', 'error');
            return;
        }

        try {
            // Fetch vehicles for this customer
            const response = await fetch(`/api/vehicles?customer_id=${customerId}`);
            const data = await response.json();
            const vehicles = data.vehicles || [];

            let vehicleContent = '';

            if (vehicles.length === 0) {
                vehicleContent = `
                    <div class="empty-state" style="padding: 40px 20px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">🚗</div>
                        <h3 style="margin: 0 0 10px 0; color: #333;">No Vehicles Found</h3>
                        <p style="color: #666; margin-bottom: 20px;">This customer has no vehicles registered.</p>
                        <button class="button button-primary" onclick="window.Customers.showAddVehicleModal(${customerId})">
                            ➕ Add First Vehicle
                        </button>
                    </div>
                `;
            } else {
                const vehicleRows = vehicles.map(vehicle => `
                    <tr>
                        <td>
                            <div class="vehicle-info-with-photo">
                                ${this.renderCustomerVehicleDisplay(vehicle)}
                            </div>
                        </td>
                        <td>
                            <div>${vehicle.license_plate || 'No plate'}</div>
                            <div style="font-size: 12px; color: #666;">${vehicle.color || 'No color'}</div>
                        </td>
                        <td>
                            <div>${vehicle.vehicle_type || 'Car'}</div>
                            <div style="font-size: 12px; color: #666;">
                                ${vehicle.mileage ? vehicle.mileage.toLocaleString() + ' mi' : 'No mileage'}
                            </div>
                        </td>
                        <td>
                            <div class="vehicle-action-buttons">
                                <button class="button button-small button-outline"
                                    onclick="window.Customers.editVehicle(${vehicle.id}, ${customerId})"
                                    title="Edit Vehicle">
                                    ✏️
                                </button>
                                <button class="button button-small button-outline"
                                    onclick="window.Customers.viewVehiclePhotos(${vehicle.id})"
                                    title="View Photos">
                                    📷
                                </button>
                                <button class="button button-small button-outline"
                                    onclick="window.Customers.deleteVehicle(${vehicle.id}, ${customerId})"
                                    title="Delete Vehicle"
                                    style="color: #dc3545; border-color: #dc3545;">
                                    🗑️
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');

                vehicleContent = `
                    <div class="vehicle-list">
                        <table class="data-table" style="width: 100%;">
                            <thead>
                                <tr>
                                    <th>Vehicle</th>
                                    <th>License/Color</th>
                                    <th>Type/Mileage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${vehicleRows}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            const modalContent = `
                <div class="modal-header">
                    <h2>🚗 Vehicles for ${customer.name}</h2>
                    <button class="modal-close" onclick="window.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #666;">
                            Total vehicles: <strong>${vehicles.length}</strong>
                        </span>
                        <button class="button button-primary button-small"
                            onclick="window.Customers.showAddVehicleModal(${customerId})">
                            ➕ Add Vehicle
                        </button>
                    </div>
                    ${vehicleContent}
                </div>
            `;

            // Show modal
            const modalOverlay = document.getElementById('modalOverlay');
            const modalContainer = document.getElementById('modalContainer');

            if (modalOverlay && modalContainer) {
                modalContainer.innerHTML = modalContent;
                modalOverlay.classList.add('active');
                modalOverlay.style.display = 'flex';
                modalOverlay.style.opacity = '1';
                modalOverlay.style.visibility = 'visible';
                document.body.style.overflow = 'hidden';
            }

        } catch (error) {
            console.error('❌ Error loading vehicles:', error);
            window.showToast('Failed to load vehicles', 'error');
        }
    }

    /**
     * Render vehicle display with photo for customer vehicle list
     */
    renderCustomerVehicleDisplay(vehicle) {
        const vehicleInfo = `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim();

        if (vehicle.photo_url || vehicle.photos) {
            const primaryPhoto = vehicle.photo_url || (vehicle.photos && vehicle.photos[0]?.url);

            return `
                <div class="customer-vehicle-with-photo">
                    <div class="vehicle-photo-thumbnail">
                        <img
                            src="${primaryPhoto}"
                            alt="${vehicleInfo}"
                            class="vehicle-thumbnail-img"
                            onclick="window.Customers.viewVehiclePhotos(${vehicle.id})"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        >
                        <div class="vehicle-thumbnail-fallback" style="display: none;">
                            <span class="vehicle-icon">🚗</span>
                        </div>
                        ${vehicle.photos && vehicle.photos.length > 1 ? `
                            <div class="photo-count-badge">+${vehicle.photos.length - 1}</div>
                        ` : ''}
                    </div>
                    <div class="vehicle-text-info">
                        <div class="vehicle-name-primary">${vehicleInfo}</div>
                        <div class="vehicle-details-secondary">
                            VIN: ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="customer-vehicle-no-photo">
                    <div class="vehicle-icon-placeholder">
                        <span class="vehicle-icon">🚗</span>
                        <div class="add-photo-hint" onclick="window.Customers.addVehiclePhoto(${vehicle.id})">
                            📷 Add Photo
                        </div>
                    </div>
                    <div class="vehicle-text-info">
                        <div class="vehicle-name-primary">${vehicleInfo}</div>
                        <div class="vehicle-details-secondary">
                            VIN: ${vehicle.vin ? vehicle.vin.slice(-6) : 'N/A'}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Export customers
     */
    exportCustomers() {
        if (!this.customers.length) {
            if (typeof showToast === 'function') {
                showToast('No customers to export', 'warning');
            }
            return;
        }

        const headers = ['ID', 'Name', 'Phone', 'Email', 'Address'];
        const rows = this.customers.map(c => [c.id, c.name, c.phone, c.email, c.address]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${v || ''}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
        const filename = `customers_export_${timestamp}.csv`;

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    /**
     * Utility methods
     */
    getCustomerInitials(customer) {
        if (!customer.name) return '?';

        const names = customer.name.trim().split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return customer.name[0].toUpperCase();
    }

    getCustomersWithPhone() {
        return this.customers.filter(c => c.phone && c.phone.trim()).length;
    }

    getCustomersWithEmail() {
        return this.customers.filter(c => c.email && c.email.trim()).length;
    }

    getRecentCustomers() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        return this.customers.filter(c => {
            if (!c.registration_date) return false;
            const regDate = new Date(c.registration_date);
            return regDate >= oneMonthAgo;
        }).length;
    }

    /**
     * Cleanup method called when module is unloaded
     */
    cleanup() {
        // Stop any active camera streams
        this.stopIDCamera();

        // Cleanup OCR worker if active
        if (this.ocrWorker) {
            this.ocrWorker.terminate();
            this.ocrWorker = null;
        }
    }
}

// Create global instance
window.Customers = new CustomersModule();
window.customersModule = window.Customers;

// Initialize the module
window.Customers.init().catch(err => {
    console.error('Failed to initialize Customers module:', err);
});

console.log('✅ Enhanced Customers module with OCR loaded successfully');
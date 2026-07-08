const fs = require('fs');
const unzipper = require('unzipper');

async function extractText(docxPath) {
    try {
        const directory = await unzipper.Open.file(docxPath);
        const file = directory.files.find(d => d.path === 'word/document.xml');
        if (!file) {
            console.log('document.xml not found');
            return;
        }
        const content = await file.buffer();
        const text = content.toString('utf-8');
        // Simple regex to extract text between <w:t> tags
        const regex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
        let match;
        const result = [];
        while ((match = regex.exec(text)) !== null) {
            result.push(match[1]);
        }
        fs.writeFileSync('./scratch/docx_text.txt', result.join('\n'));
        console.log('Extraction complete');
    } catch (e) {
        console.error(e);
    }
}

extractText(process.argv[2]);

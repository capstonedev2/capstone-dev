import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_docx(docx_path):
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
        
        tree = ET.fromstring(xml_content)
        
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        texts = []
        for paragraph in tree.findall('.//w:p', namespaces):
            para_text = []
            for run in paragraph.findall('.//w:r', namespaces):
                text_elem = run.find('w:t', namespaces)
                if text_elem is not None and text_elem.text:
                    para_text.append(text_elem.text)
            if para_text:
                texts.append(''.join(para_text))
                
        return '\n'.join(texts)
    except Exception as e:
        return f"Error: {str(e)}"

if __name__ == "__main__":
    path = sys.argv[1]
    print(extract_text_from_docx(path))

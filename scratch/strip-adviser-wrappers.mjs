import fs from 'fs';
import path from 'path';

const files = [
  'src/components/adviser/shared/components/adviser-schedule.tsx',
  'src/components/adviser/shared/components/adviser-reports.tsx',
  'src/components/adviser/shared/components/adviser-profile.tsx',
  'src/components/adviser/shared/components/adviser-notifications.tsx',
  'src/components/adviser/shared/components/adviser-evaluations.tsx',
  'src/components/adviser/shared/components/adviser-dashboard.tsx',
  'src/components/adviser/adviser-mode/adviser-title-approval.tsx',
  'src/components/adviser/adviser-mode/adviser-progress.tsx'
];

for (const file of files) {
  const fullPath = path.resolve(file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Find the start of the dashboard wrapper
  const wrapperStart = content.indexOf('<div className="dashboard-wrapper">');
  if (wrapperStart !== -1) {
    // Find the start of main-content
    const mainStart = content.indexOf('<main className="main-content">', wrapperStart);
    if (mainStart !== -1) {
      // Replace everything from <div className="dashboard-wrapper"> to <main className="main-content"> with <>
      content = content.substring(0, wrapperStart) + '<>' + content.substring(mainStart + '<main className="main-content">'.length);
      
      // Find the closing </main> and </div> at the end
      const lastMainClose = content.lastIndexOf('</main>');
      if (lastMainClose !== -1) {
        const afterMainClose = content.substring(lastMainClose + '</main>'.length);
        const lastDivClose = afterMainClose.indexOf('</div>');
        if (lastDivClose !== -1) {
          content = content.substring(0, lastMainClose) + '</>' + afterMainClose.substring(lastDivClose + '</div>'.length);
        }
      }
      fs.writeFileSync(fullPath, content);
      console.log(`Stripped wrappers from ${file}`);
    }
  }
}

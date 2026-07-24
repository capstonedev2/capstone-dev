import fs from 'fs';

const filePath = 'src/components/program-head/program-head-dashboard.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// The file has a structure:
// <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 items-start">
//   <div className="xl:col-span-8 flex flex-col gap-6">
//     <div className="bg-[var(--surface)] ..."> {/* Project Monitoring Directory, ends at </div> \n </div> */}
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Charts in left col */}
//   </div>
//   <div className="xl:col-span-4 flex flex-col gap-6"> {/* Charts in right col */}
// </div>

// We want:
// {/* Dashboard Top Section: Bento Grid */}
// <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
//   {/* All charts here */}
// </div>
// {/* Full width Table */}
// <div className="mb-8">
//   <div className="bg-[var(--surface)] ..."> {/* Project Monitoring Directory */}
// </div>

const lines = content.split('\n');

// Find the start of the layout
const layoutStart = lines.findIndex(l => l.includes('Two-Column Master Layout'));
const col8Start = lines.findIndex((l, i) => i > layoutStart && l.includes('xl:col-span-8 flex flex-col gap-6'));
const tableStart = col8Start + 1;

// Find the end of the table
const chartsGridStart = lines.findIndex((l, i) => i > tableStart && l.includes('grid grid-cols-1 md:grid-cols-2 gap-6'));
const tableEnd = chartsGridStart - 1; // It ends with a </div>

// Find the right column start
const rightColStart = lines.findIndex((l, i) => i > chartsGridStart && l.includes('Right Column: Status, Alerts'));
const leftColEnd = rightColStart - 1; // ends with </div>

// Find the end of the layout
const layoutEnd = lines.findIndex((l, i) => i > rightColStart && l.includes('ProgramHeadModal open={exportOpen}')) - 2;

const tableContent = lines.slice(tableStart, tableEnd);
// Remove the inner wrapper div closing tag at the end of tableContent if there's an extra one? Wait, the table container is just one div. Let's see:
// line 180: <div className="bg-[var(--surface)] rounded-2xl ... flex flex-col">
// line 422: </div>

const leftCharts = lines.slice(chartsGridStart + 1, leftColEnd - 1); // Extract the two charts (Project Distribution, Adviser Workload) without the wrapper
const rightCharts = lines.slice(rightColStart + 1, layoutEnd - 1); // Extract the four charts

// The left charts are actually wrapped in <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> which we don't want.
// Wait, the grid contains two items. Let's just grab the whole grid content?
// We want them as individual items in our new 3-col grid.
// LeftCharts wrapper is: <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
// So leftCharts[0] is that wrapper. We can skip it.

let extractedLeftCharts = [];
let braceCount = 0;
let capturing = false;
let currentChart = [];
for (let i = chartsGridStart + 1; i < leftColEnd - 1; i++) {
  const line = lines[i];
  if (line.includes('<div className="group bg-[var(--surface)] backdrop-blur-xl')) {
    if (braceCount === 0) {
      capturing = true;
    }
  }
  
  if (capturing) {
    currentChart.push(line);
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    braceCount += openDivs - closeDivs;
    
    if (braceCount === 0) {
      extractedLeftCharts.push([...currentChart]);
      currentChart = [];
      capturing = false;
    }
  }
}

let extractedRightCharts = [];
braceCount = 0;
capturing = false;
currentChart = [];
for (let i = rightColStart + 1; i < layoutEnd; i++) {
  const line = lines[i];
  if (line.includes('<div className="group bg-[var(--surface)] backdrop-blur-xl') || line.includes('<div className="bg-[var(--surface)] border border-[var(--border)]')) {
    if (braceCount === 0) {
      capturing = true;
    }
  }
  
  if (capturing) {
    currentChart.push(line);
    const openDivs = (line.match(/<div/g) || []).length;
    const closeDivs = (line.match(/<\/div>/g) || []).length;
    braceCount += openDivs - closeDivs;
    
    if (braceCount === 0) {
      extractedRightCharts.push([...currentChart]);
      currentChart = [];
      capturing = false;
    }
  }
}

// Assemble the new layout
const newLayout = [
  '      {/* Dashboard Top Section: Bento Grid */}',
  '      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">',
  '        {/* Top Row: Key Metrics */}',
  ...extractedLeftCharts[0] || [],
  ...extractedLeftCharts[1] || [],
  ...extractedRightCharts[2] || [], // Top Performing Adviser (was 3rd in right col)
  '',
  '        {/* Middle Row: Operations */}',
  ...extractedRightCharts[0] || [], // Accreditation Readiness
  ...extractedRightCharts[1] || [], // Intervention Queue
  ...extractedRightCharts[3] || [], // Recent Activity
  '      </div>',
  '',
  '      {/* Bottom Section: Full Width Data Directory */}',
  '      <div className="mb-8 w-full">',
  ...tableContent,
  '      </div>'
];

const finalLines = [
  ...lines.slice(0, layoutStart),
  ...newLayout,
  ...lines.slice(layoutEnd + 1)
];

fs.writeFileSync(filePath, finalLines.join('\n'));
console.log("Layout reorganized successfully!");

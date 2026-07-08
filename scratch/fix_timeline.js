const fs = require('fs');

let tsx = fs.readFileSync('src/app/page.tsx', 'utf8');

tsx = tsx.replace(
  /<div className="relative mt-16 mb-10 w-full overflow-x-auto hide-scrollbar pb-8 px-4 sm:px-6">\s*<div className="min-w-\[1100px\] relative">\s*\{\/\* Background Rail Line \*\/\}\s*<div className="absolute top-\[2\.25rem\] sm:top-\[2\.75rem\] left-\[5%\] right-\[5%\] h-2 bg-gradient-to-r from-\[#003A8F\] via-\[#418bff\] to-\[#f6be00\] rounded-full shadow-\[inset_0_2px_4px_rgba\(0,0,0,0\.1\)\] opacity-90" \/>\s*<div className="flex justify-between relative z-10 gap-4">/,
  `<div className="relative mt-16 mb-10 w-full pb-8 px-4 sm:px-6">
                <div className="relative w-full max-w-6xl mx-auto">
                  {/* Desktop Background Rail Line */}
                  <div className="hidden md:block absolute top-[2.75rem] left-[5%] right-[5%] h-2 bg-gradient-to-r from-[#003A8F] via-[#418bff] to-[#f6be00] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] opacity-90" />
                  
                  {/* Mobile Vertical Rail Line */}
                  <div className="md:hidden absolute top-[2.5rem] bottom-[2.5rem] left-[3.15rem] sm:left-[3.65rem] w-1.5 bg-gradient-to-b from-[#003A8F] via-[#418bff] to-[#f6be00] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] opacity-90" />

                  <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-4">`
);

tsx = tsx.replaceAll(
  /<div key=\{step\.title\} className="flex flex-col items-center flex-1" data-reveal="fade-up"/g,
  `<div key={step.title} className="flex flex-row md:flex-col items-center md:items-start flex-1 gap-6 md:gap-0" data-reveal="fade-up"`
);

tsx = tsx.replaceAll(
  /<div className="relative mb-6 group cursor-default">/g,
  `<div className="relative mb-0 md:mb-6 group cursor-default flex-shrink-0">`
);

tsx = tsx.replaceAll(
  /<div className=\{`bg-white\/70 backdrop-blur-xl rounded-2xl p-5 shadow-\[0_16px_40px_rgba\(15,43,89,0\.05\)\] border border-white\/80 transition-all duration-300 h-full flex flex-col items-start w-\[180px\] sm:w-\[200px\] border-t-4 \$\{t\.cardBorder\} \$\{t\.cardHover\}`\}>/g,
  `<div className={\`bg-white/70 backdrop-blur-xl rounded-2xl p-5 shadow-[0_16px_40px_rgba(15,43,89,0.05)] border border-white/80 transition-all duration-300 h-full flex flex-col items-start w-full md:w-[190px] lg:w-[200px] border-l-4 md:border-l-0 md:border-t-4 \${t.cardBorder} \${t.cardHover}\`}>`
);

fs.writeFileSync('src/app/page.tsx', tsx);
console.log('Done!');

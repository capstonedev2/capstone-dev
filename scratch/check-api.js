async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/students?limit=200");
    const all = await res.json();
    console.log("ALL STUDENTS IN DB:");
    all.forEach(s => console.log(`- ${s.name} (${s.email || s.id})`));
    
    const res2 = await fetch("http://localhost:3000/api/groups");
    const groups = await res2.json();
    console.log("\nALL GROUPS IN DB:");
    groups.forEach(g => console.log(`- Group ${g.code}: ${g.students.join(', ')}`));
    
    const res3 = await fetch("http://localhost:3000/api/students?limit=200&availableOnly=true");
    const available = await res3.json();
    console.log("\nAVAILABLE STUDENTS:");
    available.forEach(s => console.log(`- ${s.name}`));
  } catch (e) {
    console.error(e);
  }
}
run();

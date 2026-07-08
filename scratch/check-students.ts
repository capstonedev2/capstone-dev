async function run() {
  const allStudentsRes = await fetch("http://localhost:3000/api/students?limit=200");
  const allStudents = await allStudentsRes.json();
  console.log('All students names:', allStudents.map(s => s.name));
}
run();

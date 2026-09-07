import fs from 'fs';
async function run() {
  const resp = await fetch('https://raw.githubusercontent.com/rambo0247/lol-sound/main/data.json');
  const data = await resp.json();
  const keys = Object.keys(data);
  console.log('Total keys:', keys.length);
  console.log('First 30 keys:', keys.slice(0, 30).join(', '));
  console.log('\nHas Ahri:', 'Ahri' in data);
  console.log('Has Gragas:', 'Gragas' in data);
  console.log('Has Jhin:', 'Jhin' in data);
  const sampleKey = keys[0];
  const sampleVal = data[sampleKey];
  console.log('\nSample key:', sampleKey, '-> isArray:', Array.isArray(sampleVal), 'len:', Array.isArray(sampleVal) ? sampleVal.length : 'N/A');
  if (Array.isArray(sampleVal) && sampleVal.length > 0) {
    console.log('Sample entry[0]:', JSON.stringify(sampleVal[0]));
  } else {
    console.log('Sample value type:', typeof sampleVal);
    console.log('Sample snippet:', JSON.stringify(sampleVal).slice(0, 300));
  }
}
run().catch(e => { console.error(e); process.exit(1); });

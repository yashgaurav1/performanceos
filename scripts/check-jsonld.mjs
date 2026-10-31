const res = await fetch('https://performanceos-bq2ken4bz-yash-gaurav.vercel.app');
const html = await res.text();
const match = html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
if (!match) {
  console.log('No JSON-LD script found');
  process.exit(1);
}
try {
  const data = JSON.parse(match[1]);
  console.log('Valid JSON-LD:', Array.isArray(data));
  console.log('Entities:', data.map(d => d['@type']));
  for (const item of data) {
    console.log(`- Type: ${item['@type']}, Name: ${item.name || item.mainEntity?.length + ' questions'}`);
  }
} catch (err) {
  console.error('Invalid JSON:', err);
}

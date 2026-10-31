const baseUrl = 'https://performanceos-bq2ken4bz-yash-gaurav.vercel.app';

for (const path of ['/robots.txt', '/llms.txt', '/sitemap.xml']) {
  const res = await fetch(`${baseUrl}${path}`);
  console.log(`\n=== ${path} (Status: ${res.status}) ===`);
  const text = await res.text();
  console.log(text.slice(0, 300) + (text.length > 300 ? '...' : ''));
}

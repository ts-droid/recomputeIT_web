import fs from 'node:fs/promises';
import path from 'node:path';

const endpoint = 'https://api.tradera.com/v3/publicservice.asmx';
const appId = process.env.TRADERA_APP_ID;
const appKey = process.env.TRADERA_APP_KEY;
const alias = process.env.TRADERA_ALIAS || 'recomputeitnordic';
const outPath = path.resolve('public', 'data', 'tradera.json');

const ensureDir = async () => {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
};

const decodeXml = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const extractTag = (input, tag) => {
  const match = input.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXml(match[1].trim()) : '';
};

const extractItems = (xml) => {
  const items = [];
  const itemRegex = /<Item>([\s\S]*?)<\/Item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const id = extractTag(block, 'Id');
    const title = extractTag(block, 'ShortDescription') || extractTag(block, 'Title');
    const itemLink = extractTag(block, 'ItemLink');
    const thumbnail = extractTag(block, 'ThumbnailLink') || extractTag(block, 'Thumbnail');
    const image = extractTag(block, 'ImageLink') || thumbnail;
    const endDate = extractTag(block, 'EndDate');
    const buyNow = extractTag(block, 'BuyItNowPrice');
    const nextBid = extractTag(block, 'NextBid') || extractTag(block, 'MaxBid');
    const openingBid = extractTag(block, 'OpeningBid');

    if (!id || !title) continue;

    items.push({
      id,
      title,
      itemLink,
      thumbnail,
      image,
      endDate,
      buyNow,
      nextBid,
      openingBid,
    });
  }
  return items;
};

const escapeXml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const soapEnvelope = (body) => `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema"
               xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthenticationHeader xmlns="http://api.tradera.com">
      <AppId>${appId}</AppId>
      <AppKey>${appKey}</AppKey>
    </AuthenticationHeader>
    <ConfigurationHeader xmlns="http://api.tradera.com">
      <Sandbox>0</Sandbox>
      <MaxResultAge>0</MaxResultAge>
    </ConfigurationHeader>
  </soap:Header>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;

const callSoap = async (action, body) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `http://api.tradera.com/${action}`,
    },
    body: soapEnvelope(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Tradera API error ${response.status}: ${text.slice(0, 500)}`);
  }
  return response.text();
};

const fetchItems = async () => {
  const queryXml = `<Query>
  <Alias>${alias}</Alias>
  <ItemStatus>Active</ItemStatus>
  <ItemType>All</ItemType>
  <OnlyItemsWithThumbnail>true</OnlyItemsWithThumbnail>
  <ItemsPerPage>200</ItemsPerPage>
  <PageNumber>1</PageNumber>
</Query>`;

  const xml = await callSoap(
    'GetSearchResultAdvancedXml',
    `<GetSearchResultAdvancedXml xmlns="http://api.tradera.com">
       <queryXml>${escapeXml(queryXml)}</queryXml>
     </GetSearchResultAdvancedXml>`
  );

  return extractItems(xml);
};

const writeOutput = async (payload) => {
  await ensureDir();
  await fs.writeFile(outPath, JSON.stringify(payload, null, 2), 'utf-8');
};

const main = async () => {
  if (!appId || !appKey) {
    await writeOutput({
      alias,
      fetchedAt: new Date().toISOString(),
      items: [],
      error: 'Missing TRADERA_APP_ID or TRADERA_APP_KEY env vars.',
    });
    console.warn('TRADERA_APP_ID / TRADERA_APP_KEY missing. Wrote empty tradera.json.');
    return;
  }

  const items = await fetchItems();
  items.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  await writeOutput({
    alias,
    fetchedAt: new Date().toISOString(),
    items,
  });
  console.log(`Fetched ${items.length} items for ${alias}.`);
};

main().catch(async (error) => {
  await writeOutput({
    alias,
    fetchedAt: new Date().toISOString(),
    items: [],
    error: error.message,
  });
  console.error(error);
});

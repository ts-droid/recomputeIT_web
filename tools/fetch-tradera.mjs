import fs from 'node:fs/promises';
import path from 'node:path';

const endpoint = 'https://api.tradera.com/v3/searchservice.asmx';
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
  const itemRegex = /<(Item|Items)>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[2];
    const id = extractTag(block, 'Id');
    const title = extractTag(block, 'ShortDescription') || extractTag(block, 'Title');
    const itemLink = extractTag(block, 'ItemUrl') || extractTag(block, 'ItemLink');
    const thumbnail = extractTag(block, 'ThumbnailLink') || extractTag(block, 'Thumbnail');
    const imageFromLinksMatch = block.match(/<ImageLinks>[\s\S]*?<Url>([\s\S]*?)<\/Url>/);
    const imageFromLinks = imageFromLinksMatch ? decodeXml(imageFromLinksMatch[1].trim()) : '';
    const image = extractTag(block, 'ImageLink') || imageFromLinks || thumbnail;
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

const extractError = (xml) => {
  const match = xml.match(/<Errors>[\s\S]*?<Message>([\s\S]*?)<\/Message>/);
  return match ? decodeXml(match[1].trim()) : '';
};

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

const buildSearchRequest = (itemType) => `<SearchAdvanced xmlns="http://api.tradera.com">
       <request>
         <SearchWords></SearchWords>
         <SearchInDescription>false</SearchInDescription>
         <Alias>${alias}</Alias>
         <CategoryId>0</CategoryId>
         <ItemStatus>Active</ItemStatus>
         <ItemType>${itemType}</ItemType>
         <ItemsPerPage>200</ItemsPerPage>
         <PageNumber>1</PageNumber>
         <OrderBy>EndDateAscending</OrderBy>
       </request>
     </SearchAdvanced>`;

const fetchItems = async () => {
  const trySearch = async (itemType) => {
    const xml = await callSoap('SearchAdvanced', buildSearchRequest(itemType));
    const apiError = extractError(xml);
    if (apiError) {
      throw new Error(`Tradera SearchAdvanced error (${itemType}): ${apiError}`);
    }
    return extractItems(xml);
  };

  const shopItems = await trySearch('ShopItem');
  if (shopItems.length > 0) {
    return shopItems;
  }

  return trySearch('All');
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

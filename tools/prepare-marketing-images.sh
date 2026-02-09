#!/usr/bin/env bash
set -euo pipefail

ASSET_DIR="public/images/marketing"
mkdir -p "$ASSET_DIR"

download() {
  local url="$1"
  local out="$2"
  curl -L "$url" -o "$out"
}

download "https://static.wixstatic.com/media/38c12f_4abaf80551994a13889f52b02dfa9acd~mv2_d_1920_1280_s_2.jpg/v1/fill/w_980%2Ch_653%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/38c12f_4abaf80551994a13889f52b02dfa9acd~mv2_d_1920_1280_s_2.jpg" "$ASSET_DIR/hero-repair.jpg"
download "https://static.wixstatic.com/media/38c12f_cb7fcfcff39c4192bbbe9f1b13a899a3~mv2_d_1920_1280_s_2.jpg/v1/fill/w_980%2Ch_653%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/38c12f_cb7fcfcff39c4192bbbe9f1b13a899a3~mv2_d_1920_1280_s_2.jpg" "$ASSET_DIR/hero-pickup.jpg"
download "https://static.wixstatic.com/media/38c12f_fa4c76951534421598b3130dbd646c7c~mv2_d_1920_1271_s_2.jpg/v1/crop/x_0%2Cy_211%2Cw_1920%2Ch_1047/fill/w_298%2Ch_165%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/38c12f_fa4c76951534421598b3130dbd646c7c~mv2_d_1920_1271_s_2.jpg" "$ASSET_DIR/product-consoles.jpg"
download "https://static.wixstatic.com/media/38c12f_51e7ab4665014e2185ae92400f96ef43~mv2_d_1920_1281_s_2.jpg/v1/crop/x_223%2Cy_132%2Cw_1697%2Ch_1104/fill/w_297%2Ch_161%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/38c12f_51e7ab4665014e2185ae92400f96ef43~mv2_d_1920_1281_s_2.jpg" "$ASSET_DIR/product-headphones.jpg"
download "https://static.wixstatic.com/media/38c12f_a04e90e88c37468a8965de5782b525bb~mv2.jpg/v1/crop/x_381%2Cy_102%2Cw_1326%2Ch_740/fill/w_299%2Ch_161%2Cal_c%2Cq_80%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/38c12f_a04e90e88c37468a8965de5782b525bb~mv2.jpg" "$ASSET_DIR/product-tv.jpg"
download "https://cdn.pixabay.com/photo/2023/04/03/19/37/soldering-7897827_1280.jpg" "$ASSET_DIR/soldering.jpg"
download "https://cdn.pixabay.com/photo/2021/09/11/17/35/motherboard-6616120_1280.jpg" "$ASSET_DIR/motherboard.jpg"

echo "Downloaded marketing images to $ASSET_DIR"

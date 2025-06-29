import axios from "axios";
/**
 * @swagger
 * /item-uploads/process-image:
 *   post:
 *     summary: Xử lý ảnh vật phẩm (remove background + phân tích AI)
 *     description: Upload ảnh, loại bỏ background, phân tích với Gemini AI và trả về URL cùng metadata chi tiết
 *     tags: [Item Uploads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File ảnh vật phẩm (PNG, JPG, JPEG)
 *     responses:
 *       200:
 *         description: Xử lý ảnh thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'success'
 *                 message:
 *                   type: string
 *                   example: 'Image processed successfully with background removed and AI analysis'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       description: URL của ảnh đã xử lý
 *                     backgroundRemoved:
 *                       type: boolean
 *                       description: Có loại bỏ background thành công hay không
 *                     aiMetadata:
 *                       type: object
 *                       nullable: true
 *                       description: Metadata từ Gemini AI analysis
 *                       properties:
 *                         category:
 *                           type: string
 *                           description: Danh mục chính của vật phẩm
 *                         subCategory:
 *                           type: string
 *                           description: Danh mục phụ cụ thể
 *                         colors:
 *                           type: object
 *                           properties:
 *                             primary:
 *                               type: string
 *                               description: Màu chính
 *                             secondary:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               description: Các màu phụ
 *                             pattern:
 *                               type: string
 *                               description: Mô tả họa tiết
 *                         style:
 *                           type: string
 *                           description: Phong cách (casual, formal, sporty, etc.)
 *                         material:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               description: Loại vải/chất liệu
 *                             texture:
 *                               type: string
 *                               description: Kết cấu
 *                             thickness:
 *                               type: string
 *                               description: Độ dày
 *                         features:
 *                           type: object
 *                           properties:
 *                             sleeves:
 *                               type: string
 *                               description: Kiểu tay áo
 *                             neckline:
 *                               type: string
 *                               description: Kiểu cổ áo
 *                             length:
 *                               type: string
 *                               description: Độ dài
 *                             fit:
 *                               type: string
 *                               description: Kiểu dáng
 *                             closure:
 *                               type: string
 *                               description: Kiểu khóa/cài
 *                             pockets:
 *                               type: boolean
 *                               description: Có túi hay không
 *                         season:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Mùa phù hợp
 *                         occasions:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Dịp phù hợp
 *                         tags:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Các từ khóa mô tả
 *                         description:
 *                           type: string
 *                           description: Mô tả chi tiết bằng tiếng Việt
 *                         confidence:
 *                           type: number
 *                           description: Độ tin cậy phân tích (0-100)
 *                         analyzedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Thời gian phân tích
 *                         source:
 *                           type: string
 *                           example: 'gemini-ai'
 *                           description: Nguồn phân tích
 *                         model:
 *                           type: string
 *                           example: 'gemini-2.0-flash-exp'
 *                           description: Model AI đã sử dụng
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc không có file
 *       401:
 *         description: Không được ủy quyền
 *       500:
 *         description: Lỗi server
 */

// Upload ảnh, trả về imageUrl (KHÔNG tạo item). Sau đó client gọi POST /items với imageUrl để tạo item.
// router.post(
//   '/process-image',
//   authentication,
//   singleUpload('image'),
//   ItemUploadController.processImageOnly
// );
const imageList = [
    // 'https://product.hstatic.net/1000360022/product/frame__qjid0235-mau_moi_8c5096e2dfe74661bee7611dca91bdfb_1024x1024.jpg',
    // 'https://product.hstatic.net/1000360022/product/id-1755a_eeebc63cc44b406ebe352e4b4f443cc0_1024x1024.jpg',
    // 'https://product.hstatic.net/1000360022/product/qjid0239-moi-_doc__41076adf4265461b9bd006266f46dea2_1024x1024.jpg',
    // 'https://product.hstatic.net/1000360022/product/quan_jean_nam_blue_sand_ong_suong_vintage_wash_form_straight_51408e414a4949e7b1512d20a679b43a_1024x1024.jpg',
    // 'https://product.hstatic.net/1000360022/product/quan-jeans-icondenim-checkered-jacquard-straight__2__1b3463159a274deab135daf9650a862a_1024x1024.jpg',
    // 'https://product.hstatic.net/1000360022/product/quan-jean-icondenim-meet-every-challenge-with-courage__1__8d142b27c3f44df8baf6525613025ecf_1024x1024.jpg',
    // 'https://product.hstatic.net/1000360022/product/id-005745a_7b82bd945db348eda6432e089be484d1_1024x1024.jpghttps://product.hstatic.net/1000360022/product/id-2109a_3b578afa41774dc6b2ce80740e8287af_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/quan-short-boi-lung-thun-day-rut-basic__2__6afc2f430ad246bca26705323e4eb1b9_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/quan-short-icondenim-flexible__2__3f756f92a83b442d9daa00508b4f5869_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-009273a_432e3e85ba6e4ec78bb9fee1f7e45bd2_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-1974a_0bacedf0f7454499b7fa20ae91ddcb71_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/quan-tay-icondenim-metro-ease__4__ddc4b299c61843389fbe04763e5d4bd8_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/quan-kaki-cargo-icondenim-icdn-tag__4__2d00c781e3f4479fb56b539a167520a6_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/quan-jogger-pique-nam-mythical-figures-form-regular__7__3bfecbb07a1546168e9c7edb0e07688d_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-011517a_75b2f6b112244b8f9a01b1670c30a310_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-008221a__1__e08ad032e7bd4686b6765710ccd1e901_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-013287a_a41193c8ace140c3bf2873a52d3aac4e_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-006134a_20c78decf36f4dacaf8361cee184b680_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/_o_thun_nam_h_a_ti_t_in_the_coastal_frenzy_orgnls_form_regular_21dcb7db07534fcc908ad8a28ee13e56_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-1612a_3e162ae01c0847e6807d44f0d7c5cfe8_1024x1024.jpg',
    'https://product.hstatic.net/1000360022/product/id-1601a_8c8a8c27afd64c14827fc5d26392e95e_1024x1024.jpg'
]
const token ='eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODJlMDg5NGRhYTY5ODQxZTI2ZWY3N2IiLCJlbWFpbCI6InNvbnRyYW5uZUBnbWFpbC5jb20iLCJyb2xlcyI6WyJVU0VSIl0sImlhdCI6MTc0OTYyNDgzMSwianRpIjoiYjk2YmY3NzY3Y2MxYzdhNmFjNGFjMzBlN2M1YmE5MDZhYjZiM2M2NWJjNTljMzQyN2RiNjZjOGY1NGE2OWU5NF8xNzQ5NjI0ODMxMDAzX3Vua25vd25fbm9kZXZpY2VfcXR5ZTRkY2c5ZGkiLCJleHAiOjE3NDk2Mjg0MzF9.gGTxw_6Q834iWU6-hGkvHRtmp4-L53Vy5Qkvz2LZ7IFN5xbZzHOUPwuADtxhCP5WTMc_2RMAQFunAmrwbIvsjQJL3xRk0itHgAeWHYtVDJKvveis9bmC--gP_nWG9GvzGJzBR2FHH293Tmpz3LIBmikO_afWP06-L7tIfvS1YEuV4XzRrR5xuKYNvljr8ZEGNdkQq46TvljVxRch4SD5mDw6FOcQ0ZaOR1J3nOtMd7AOMe7U0bQ4by_rHwlEYTQDB5vHseOkxM1aG5YfhNIqgIcOpyNLGFJgzpXzMV1Ggl3dnbupssdx1myJvVYbxhjlRzzE63Cxn_GDqHjKcDEFPQ';
for await (const imageUrl of imageList) {
    // download image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const file = new File([response.data], "image.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("image", file);
    const resp=  await axios.post('http://localhost:3052/v1/api/item-uploads/process-image', formData, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const metadata = resp.data.metadata;
    const payload={
        name: metadata.aiMetadata.description.split(',')[0].split('.')[0] || 'Chưa xác định',
        category: metadata.aiMetadata.category || 'Chưa xác định',
        subCategory: metadata.aiMetadata.subCategory || 'Chưa xác định',
        occasion: metadata.aiMetadata.occasion,
        brand: metadata.aiMetadata.brand || 'Chưa xác định',
        material: metadata.aiMetadata.material.type || 'Chưa xác định',
        note: metadata.aiMetadata.description || 'Không có mô tả',
        aiMeta: metadata.aiMetadata || {},
        imageUrl: metadata.imageUrl || '',
        style: metadata.aiMetadata.style ,
        color: metadata.aiMetadata.colors.primary ,
        position: metadata.aiMetadata.position,
    }
    await axios.post('http://localhost:3052/v1/api/items', payload, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).then(response => {
        console.log('Item created:', response.data);
    }).catch(error => {
        console.error('Error creating item:', error.response ? error.response.data : error.message);
    });
    console.log(`Processed image: ${imageUrl}`, `- Item created with name: ${payload.name}`);
    await new Promise(resolve => setTimeout(resolve, 60000)); // Delay 60s between requests
    
}
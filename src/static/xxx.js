/**
 * 
 * @param {File} file file 对象
 * @param {String} text 水印文字 
 */
 export async function addWatermarkToImage(file, text) {
  const { name = 'file' } = file
  const fileUrl = await toBase64(file)
  const img = new Image()
  return new Promise((resolve) => {
    img.src = fileUrl
    img.onload = function () {
      const { width, height } = img
      // 图片等比例缩小了倍数，1表示不变，2表示缩小1倍
      const scaleNum = 1
      const { canvas, ctx, canvasWidth, canvasHeight } = createImgCanvas(width / scaleNum, height / scaleNum)
      ctx.drawImage(img, 0, 0, width, height, 0, 0, canvasWidth, canvasHeight);
      addWaterMark(ctx, canvasWidth, canvasHeight, text)
      const base64Url = canvas.toDataURL();
      const file2 = dataURLtoFile(base64Url, name)
      resolve(file2)
    }
  })
}

/**
 * 将 file 文件转成 base64 格式
 * 
 * @param {*} file 
 * @returns 
 */
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    // 核心代码
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * 将base64转换为文件
 * 
 * @param {*} dataurl 
 * @param {*} filename 
 * @returns 
 */
function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * 创建图片等大小的图层
 * 
 * @param {*} width 
 * @param {*} height 
 * @returns 
 */
function createImgCanvas(width, height) {
  const canvas = document.createElement('canvas');
  const canvasWidth = width
  const canvasHeight = height
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx, canvasWidth, canvasHeight }
}

/**
 * 为图片图层添加水印
 * 
 * @param {*} imgCtx
 * @param {*} width 
 * @param {*} height 
 */
function addWaterMark(imgCtx, width, height, text) {
  const watermarkCanvas = createWatermark(width, height, text)
  const pat = imgCtx.createPattern(watermarkCanvas, 'repeat');
  imgCtx.fillStyle = pat;
  imgCtx.fillRect(0, 0, width, height);
}

/**
 * 创建水印图层
 * 
 * @param {*} imgWidth 
 * @param {*} imgHeight 
 * @param {*} text 
 * @returns 
 */
function createWatermark(imgWidth, imgHeight, text) {
  const watermarkCanvas = document.createElement('canvas')
  const { sqrt, pow, sin, cos, tan } = Math;
  // 字体大小-宽度的2%
  const fontSize = parseInt(imgWidth * 0.02, 10)

  // 水印实际长度, 2列
  const watermarkWidth = parseInt((imgWidth) / 2, 10)
  // 水印实际高度， 5行
  const watermarkHeight = parseInt((imgHeight + 12 * fontSize) / 5, 10)
  // 逆时针旋转角度
  const rotate = 15

  watermarkCanvas.width = sqrt(pow(watermarkWidth, 2) + pow(watermarkHeight, 2));
  watermarkCanvas.height = watermarkHeight;

  const watermarkCtx = watermarkCanvas.getContext('2d')
  watermarkCtx.font = `${fontSize}px Microsoft Yahei`
  watermarkCtx.fillStyle = "rgba(200,200, 200, 0.7)";
  // 30个汉字
  // const text = "字节跳动电子商务有限公司字节跳动电子商务有限公司商务有限公司"
  // 60个英文字符
  // const text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  // 1个字符
  // const text = "1"
  // 23个汉字
  // const text = "字节跳动电子商务有限公司字节跳动电子商务有限公"
  // 10个汉字
  // const text = "字节跳动电子商务有限"
  // const textWidth = watermarkCtx.measureText(text).width;
  watermarkCtx.rotate(-rotate * Math.PI / 180)
  const Y = parseInt(sin(rotate * Math.PI / 180) * watermarkWidth, 10);
  const X = -parseInt(Y / tan((90 - rotate) * Math.PI / 180), 10);
  renderText(watermarkCtx, watermarkWidth - 11 * fontSize, text, X + 2 * fontSize, Y - fontSize, fontSize * 1.4)
  return watermarkCanvas
}

/**
 * 渲染水印文字：指定长度内换行
 * 
 * @param {*} ctx 
 * @param {*} width 
 * @param {*} str 
 * @param {*} initX 
 * @param {*} initY 
 * @param {*} lineHeight 
 */
function renderText(ctx, width, str, initX, initY, lineHeight = 20) {
  var lineWidth = 0;
  var canvasWidth = width;
  var lastSubStrIndex = 0;
  for (let i = 0;i < str.length;i++) {
    lineWidth += ctx.measureText(str[i]).width;
    // 行内剩余空间放不下一个字的时候
    if (lineWidth > canvasWidth - initX) {
      // 减去initX,防止边界出现的问题
      ctx.fillText(str.substring(lastSubStrIndex, i), initX, initY);
      initY += lineHeight;
      lineWidth = 0;
      lastSubStrIndex = i;
    }
    if (i === str.length - 1) {
      ctx.fillText(str.substring(lastSubStrIndex, i + 1), initX, initY);
    }
  }
}
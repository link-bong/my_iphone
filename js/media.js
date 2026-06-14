/**
 * media.js — 图片压缩与头像/媒体工具
 */
window.MI = window.MI || {};

MI.Media = {
  MAX_WIDTH: 800,
  MAX_HEIGHT: 800,
  JPEG_QUALITY: 0.82,

  isImage: function (value) {
    return value && typeof value === 'string' && value.indexOf('data:image') === 0;
  },

  isEmojiAvatar: function (value) {
    return value && !this.isImage(value);
  },

  /**
   * 压缩图片为 data URL
   */
  compressFile: function (file, callback, onError) {
    if (!file || !file.type || file.type.indexOf('image') !== 0) {
      if (onError) onError('请选择图片文件');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        var maxW = MI.Media.MAX_WIDTH;
        var maxH = MI.Media.MAX_HEIGHT;
        if (w > maxW || h > maxH) {
          var ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        try {
          var dataUrl = canvas.toDataURL('image/jpeg', MI.Media.JPEG_QUALITY);
          callback(dataUrl);
        } catch (err) {
          if (onError) onError('图片处理失败');
        }
      };
      img.onerror = function () {
        if (onError) onError('图片加载失败');
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      if (onError) onError('文件读取失败');
    };
    reader.readAsDataURL(file);
  },

  /**
   * 触发文件选择并压缩
   */
  pickImage: function (callback, onError) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) return;
      MI.Media.compressFile(file, callback, onError);
    });
    input.click();
  }
};

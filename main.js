// ==UserScript==
// @name         百度图片下载助手
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在百度图片页面添加搜索框，支持搜索和下载图片
// @author       You
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// ==/UserScript==

(function() {
    'use strict';

    // 创建浮动窗口
    const floatingWindow = document.createElement('div');
    floatingWindow.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: white;
        border: 1px solid #ccc;
        padding: 10px;
        z-index: 9999;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        max-height: 80vh;
        overflow-y: auto;
        border-radius: 8px;
    `;

    // 创建标题栏
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid #eee;
    `;

    const title = document.createElement('h3');
    title.textContent = '图片下载助手';
    title.style.cssText = 'margin: 0; font-size: 14px; color: #333;';

    // 创建关闭按钮
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 20px;
        height: 20px;
        line-height: 1;
    `;
    closeButton.addEventListener('click', function() {
        floatingWindow.style.display = 'none';
    });

    header.appendChild(title);
    header.appendChild(closeButton);

    // 创建搜索框
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '输入关键词搜索图片';
    searchInput.style.cssText = `
        width: 100%;
        padding: 8px;
        margin-bottom: 10px;
        box-sizing: border-box;
        border: 1px solid #ddd;
        border-radius: 4px;
    `;

    // 创建搜索按钮
    const searchButton = document.createElement('button');
    searchButton.textContent = '搜索';
    searchButton.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #4e6ef2;
        color: white;
        border: none;
        cursor: pointer;
        margin-bottom: 10px;
        border-radius: 4px;
        font-weight: bold;
    `;

    // 创建下载按钮
    const downloadButton = document.createElement('button');
    downloadButton.textContent = '一键下载所有图片';
    downloadButton.style.cssText = `
        width: 100%;
        padding: 8px;
        background: #f2744e;
        color: white;
        border: none;
        cursor: pointer;
        margin-bottom: 10px;
        display: none;
        border-radius: 4px;
        font-weight: bold;
    `;

    // 创建结果容器
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'bd-image-results';

    // 组装浮动窗口
    floatingWindow.appendChild(header);
    floatingWindow.appendChild(searchInput);
    floatingWindow.appendChild(searchButton);
    floatingWindow.appendChild(downloadButton);
    floatingWindow.appendChild(resultsContainer);
    document.body.appendChild(floatingWindow);

    let imageUrls = [];

    // 搜索按钮点击事件
    searchButton.addEventListener('click', function() {
        const keyword = searchInput.value.trim();
        if (keyword) {
            searchBaiduImages(keyword);
        }
    });

    // 下载按钮点击事件
    downloadButton.addEventListener('click', function() {
        imageUrls.forEach((url, index) => {
            setTimeout(() => {
                GM_download({
                    url: url,
                    name: `baidu_image_${index + 1}.jpg`,
                    onload: function() {
                        console.log(`图片 ${index + 1} 下载成功`);
                    },
                    onerror: function(e) {
                        console.error(`图片 ${index + 1} 下载失败:`, e);
                    }
                });
            }, index * 500); // 延迟下载，避免同时请求过多
        });
    });

    // 百度图片搜索函数
    function searchBaiduImages(keyword) {
        const apiUrl = `https://image.baidu.com/search/acjson?tn=resultjson_com&logid=10913526997507587183&ipn=rj&ct=201326592&is=&fp=result&queryWord=${encodeURIComponent(keyword)}&cl=2&lm=-1&ie=utf-8&oe=utf-8&adpicid=&st=-1&z=&ic=0&hd=&latest=&copyright=&word=${encodeURIComponent(keyword)}&s=&se=&tab=&width=&height=&face=0&istype=2&qc=&nc=1&fr=&expermode=&force=&cg=girl&pn=0&rn=30&gsm=1e&1699625964670=`;

        GM_xmlhttpRequest({
            method: "GET",
            url: apiUrl,
            onload: function(response) {
                try {
                    // 处理百度API返回的特殊格式
                    let jsonStr = response.responseText;
                    jsonStr = jsonStr.replace(/\\'/g, "'");
                    const data = JSON.parse(jsonStr);

                    if (data && data.data) {
                        displayImages(data.data);
                        downloadButton.style.display = 'block';
                    }
                } catch (e) {
                    console.error('解析JSON失败:', e);
                }
            },
            onerror: function(error) {
                console.error('搜索请求失败:', error);
            }
        });
    }

    // 显示图片结果
    function displayImages(images) {
        resultsContainer.innerHTML = '';
        imageUrls = [];

        images.forEach(item => {
            if (!item.thumbURL) return;

            const imgWrapper = document.createElement('div');
            imgWrapper.style.marginBottom = '10px';

            const img = document.createElement('img');
            img.src = item.thumbURL;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.borderRadius = '4px';

            const dlLink = document.createElement('a');
            dlLink.href = item.thumbURL;
            dlLink.download = true;
            dlLink.textContent = '下载';
            dlLink.style.cssText = `
                display: block;
                text-align: center;
                padding: 5px;
                background: #f0f0f0;
                text-decoration: none;
                color: #333;
                border-radius: 0 0 4px 4px;
                margin-top: -4px;
            `;

            imgWrapper.appendChild(img);
            imgWrapper.appendChild(dlLink);
            resultsContainer.appendChild(imgWrapper);

            imageUrls.push(item.thumbURL);
        });
    }
})();

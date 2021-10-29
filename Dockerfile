# syntax=docker/dockerfile:1

####################################################################################################
#                                             构建 + 生产阶段
####################################################################################################
# @refer: https://hub.docker.com/_/node?tab=tags
# 对镜像体积有严格要求的话可以换成 slim 或者 alpine
FROM node:lts AS build

LABEL authors="cigaret"
LABEL email="kcigaret@outlook.com"

RUN apt-get update \
    && apt-get -y upgrade \
    # 容器中运行 Puppeteer 可能会因为基础库不全而报错，将缺失的库下载好即可
    # @refer: https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md
    # @refer: https://stackoverflow.com/questions/66214552/tmp-chromium-error-while-loading-shared-libraries-libnss3-so-cannot-open-sha
    && apt-get -y install ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils

WORKDIR /app

# 将项目描述文件拷贝到容器中执行依赖下载和安装，使其成为单独的缓存层，
# 只要项目描述文件不变，依赖不变，就不必每次构建镜像都下载依赖
# 本项目依赖中涉及到 GFW 外的资源，使用 cnpm 从国内镜像下载
# @refer: https://support.circleci.com/hc/en-us/articles/360044577411-ERROR-Failed-to-download-Chromium-r686378-
# @refer: https://github.com/puppeteer/puppeteer/issues/1597#issuecomment-351945645
COPY package.json package-lock.json ./
RUN npm install -g cnpm --registry=https://registry.npm.taobao.org \
    && cnpm install

COPY . .

RUN npm config set registry https://registry.npm.taobao.org/ \
    && npm run dist

# 使用下面这行命令可以将 npm registry 替换为 npm 原始 registry
# RUN npm config set registry https://registry.npmjs.org/

ENTRYPOINT ["node"]

CMD ["./bin/startNotifier.js"]

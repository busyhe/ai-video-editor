# AI 视频编辑器 API 文档

## 项目描述

AI 视频编辑器是一个基于 Web 的视频编辑工具，支持多图层视频合成、数字人配音、字幕生成等功能。系统采用前后端分离架构，前端使用 Vue.js 框架开发，后端提供 RESTful API 接口。

### 主要功能

1. 文件管理
   - 支持上传、下载各类媒体文件
   - 支持 PPT 转图片功能
   - 支持文件格式转换

2. 资源管理
   - 支持视频、音频、图片等多媒体资源的管理
   - 提供资源搜索和分类功能
   - 支持资源重命名和删除

3. 视频编辑
   - 多图层视频合成
   - 支持主视频、主音频、图片、数字人等图层
   - 支持图层缩放、位置调整、时间轴控制
   - 支持视频格式转换和编码设置

4. 数字人功能
   - 支持多种语音合成引擎（Edge TTS、RVC、GPT-SoVits）
   - 支持数字人动作和表情控制
   - 支持数字人配音和字幕生成

5. 项目管理
   - 支持多项目创建和管理
   - 项目日志记录和追踪
   - 项目数据保存和恢复

6. 批处理任务
   - 支持异步视频合成任务
   - 任务进度实时监控
   - 多步骤任务处理流程

### 技术特点

1. 视频处理
   - 支持多种视频编码格式
   - 支持视频分辨率调整
   - 支持帧率控制
   - 支持音频采样率设置

2. 图层系统
   - 支持多图层叠加
   - 支持图层透明度控制
   - 支持图层时间轴控制
   - 支持图层位置和缩放调整

3. 数字人系统
   - 支持多种语音合成引擎
   - 支持数字人动作和表情
   - 支持数字人配音和字幕
   - 支持数字人背景处理

4. 任务系统
   - 支持异步任务处理
   - 支持任务进度监控
   - 支持任务状态管理
   - 支持多步骤任务流程

## 目录

- [文件服务 API](#文件服务-api)
- [资源管理 API](#资源管理-api)
- [视频管理 API](#视频管理-api)
- [音频管理 API](#音频管理-api)
- [项目管理 API](#项目管理-api)
- [批处理任务 API](#批处理任务-api)

## 文件服务 API

### 文件上传

上传文件到服务器指定路径。

**请求地址**：`/upload`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 要上传的文件对象 |
| path | string | 是 | 文件在服务器上的存储路径 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| name | string | 文件名称 |
| size | number | 文件大小 |
| url | string | 文件地址 |
| cover | | 预览图 |
| duration | | 上传视频音频返回 |

**返回示例**：

```json
{
    "name": "",
    "size": "",
    "url": "",
    "cover": "",
    "duration": "" 
}
```

### 文件下载

从服务器下载指定 URL 的文件。

**请求地址**：`/download/{url}`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| url | string | 是 | 要下载的文件 URL |

**返回格式**：Blob 数据

### PPT 转图片

将 PowerPoint 文件转换为图片集合。（图片上传支持 .jpg,.png,.pptx, 当上传文件为 pptx 格式调用此接口）

**请求地址**：`/ppt/ppt2image`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 要转换的 PPT 文件对象 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| images | array | 转换后的图片列表 |
| images[].url | string | 图片访问URL |
| images[].index | number | 图片在PPT中的序号 |

**返回示例**：

```json
{
    "images": [
        {
            "url": "https://example.com/files/ppt/slide1.jpg",
            "index": 1
        },
        {
            "url": "https://example.com/files/ppt/slide2.jpg",
            "index": 2
        }
    ]
}
```

## 资源管理 API

### 加载资源列表

获取指定类型的资源列表。

**请求地址**：`/resource/list`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 | 可选值 |
|--------|------|------|------|--------|
| type | string | 是 | 资源类型 | video（视频）、bgm（背景音乐）、image（图片）、voice（声音）等 |
| current | number | 是 | 当前页码 | 从 1 开始 |
| size | number | 是 | 每页数量 | 建议值：10、20、50、100 |
| keyword | string | 否 | 搜索关键词 | 支持模糊搜索 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| records | array | 资源记录列表 |
| records[].id | string | 资源唯一标识 |
| records[].name | string | 资源名称 |
| records[].type | string | 资源类型 |
| records[].url | string | 资源访问地址 |
| records[].duration | number | 资源时长（秒），视频/音频资源特有 |
| records[].size | number | 资源大小（字节） |
| records[].cover | string | 资源封面图片URL |
| records[].creator | string | 资源创建者ID |
| records[].createTime | string | 资源创建时间（ISO 8601格式） |
| total | number | 资源总数 |
| size | number | 每页数量 |
| current | number | 当前页码 |

**返回示例**：

```json
{
  "id": "1",
  "name": "示例视频",
  "type": "video",
  "url": "/resource/1.mp4",
  "duration": 120,
  "size": 1024000,
  "cover": "/resource/1.jpg",
  "creator": "user123",
  "createTime": "2024-03-31T10:00:00Z"
}
```

### 获取资源数量

获取指定类型和关键词的资源总数。

**请求地址**：`/resource/count`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 是 | 资源类型 |
| keyword | string | 否 | 搜索关键词 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| count | number | 符合条件的资源总数 |

**返回示例**：

```json
100
```

### 搜索资源

搜索资源列表。

**请求地址**：`/resource/search`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| current | number | 是 | 当前页码 |
| size | number | 是 | 每页数量 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| records | array | 搜索结果列表 |
| records[].id | string | 资源唯一标识 |
| records[].name | string | 资源名称 |
| records[].type | string | 资源类型 |
| records[].url | string | 资源访问地址 |
| total | number | 搜索结果总数 |

**返回示例**：

```json
{
    "records": [
        {
            "id": "1",
            "name": "搜索结果",
            "type": "video",
            "url": "https://example.com/resource/1.mp4"
        }
    ],
    "total": 50
}
```

### 加载头像列表

获取可用的头像列表。

**请求地址**：`/avatar/list`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| uid | string | 是 | 用户ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | string | 头像唯一标识 |
| name | string | 头像名称 |
| type | string | 头像类型（avatar） |
| url | string | 头像图片URL |
| cover | string | 头像封面URL |
| creator | string | 创建者ID |

**返回示例**：

```json
[
    {
        "id": "1",
        "name": "头像1",
        "type": "avatar",
        "url": "https://example.com/avatars/1.png",
        "cover": "https://example.com/avatars/1_cover.png",
        "creator": "user123"
    }
]
```

### 获取头像信息

获取指定头像的详细信息。

**请求地址**：`/avatar/info`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 头像ID |
| creator | string | 是 | 创建者ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | string | 头像唯一标识 |
| name | string | 头像名称 |
| type | string | 头像类型 |
| url | string | 头像图片URL |
| cover | string | 头像封面URL |
| creator | string | 创建者ID |
| fileName | string | 原始文件名 |
| size | number | 文件大小（字节） |
| suffix | string | 文件后缀名 |

**返回示例**：

```json
{
    "id": "1",
    "name": "头像1",
    "type": "avatar",
    "url": "https://example.com/avatars/1.png",
    "cover": "https://example.com/avatars/1_cover.png",
    "creator": "user123",
    "fileName": "avatar1.png",
    "size": 1024000,
    "suffix": "png"
}
```

### 保存头像

保存新的头像信息。

**请求地址**：`/avatar/save`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 否 | 头像ID（新建时不需要） |
| fileName | string | 是 | 原始文件名 |
| name | string | 是 | 头像名称 |
| size | number | 是 | 文件大小 |
| suffix | string | 是 | 文件后缀名 |
| url | string | 是 | 头像图片URL |
| cover | string | 是 | 头像封面URL |
| creator | string | 是 | 创建者ID |
| type | string | 否 | 头像类型（默认：picture） |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |

**返回示例**：

```json
{
    "success": true,
    "message": "保存成功"
}
```

### 删除头像

删除指定头像。

**请求地址**：`/avatar/del`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 头像ID |
| creator | string | 是 | 创建者ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |

**返回示例**：

```json
{
    "success": true,
    "message": "删除成功"
}
```

### 获取头像动作列表

获取指定头像可用的动作列表。

**请求地址**：`/avatar/motion/select`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| aid | string | 是 | 头像ID |
| creator | string | 是 | 创建者ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | string | 动作唯一标识 |
| aid | string | 所属头像ID |
| name | string | 动作名称 |
| url | string | 动作视频URL |
| cover | string | 动作封面URL |
| duration | number | 动作时长（秒） |
| creator | string | 创建者ID |

**返回示例**：

```json
[
    {
        "id": "motion1",
        "aid": "avatar1",
        "name": "动作1",
        "url": "https://example.com/motions/1.mp4",
        "cover": "https://example.com/motions/1_cover.jpg",
        "duration": 5,
        "creator": "user123"
    }
]
```

### 保存头像动作

保存新的头像动作。

**请求地址**：`/avatar/motion/save`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 否 | 动作ID（新建时不需要） |
| aid | string | 是 | 所属头像ID |
| name | string | 是 | 动作名称 |
| url | string | 是 | 动作视频URL |
| cover | string | 是 | 动作封面URL |
| duration | number | 是 | 动作时长 |
| creator | string | 是 | 创建者ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |

**返回示例**：

```json
{
    "success": true,
    "message": "保存成功"
}
```

### 删除头像动作

删除指定头像动作。

**请求地址**：`/avatar/motion/del`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 动作ID |
| creator | string | 是 | 创建者ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |

**返回示例**：

```json
{
    "success": true,
    "message": "删除成功"
}
```

### 语音转文本

将语音文件转换为文本。

**请求地址**：`/speech-text`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 语音文件对象 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| text | string | 转换后的文本内容 |
| duration | number | 语音时长（秒） |
| language | string | 识别出的语言 |

**返回示例**：

```json
{
    "text": "转换后的文本内容",
    "duration": 10.5,
    "language": "zh-CN"
}
```

### 获取代币数量

获取用户的代币数量。

**请求地址**：`/tokens/getTokensQuantity`

**请求方法**：GET

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| quantity | number | 当前代币数量 |

**返回示例**：

```json
{
    "quantity": 100
}
```

### 使用兑换码

使用代币兑换码。

**请求地址**：`/tokens/applyRedeemCode`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | string | 是 | 兑换码 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |
| quantity | number | 兑换的代币数量 |

**返回示例**：

```json
{
    "success": true,
    "message": "兑换成功",
    "quantity": 50
}
```

### 消耗代币

消耗用户代币。

**请求地址**：`/tokens/expendTokens`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| quantity | number | 是 | 消耗的代币数量 |
| message | string | 是 | 消耗原因说明 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| success | boolean | 操作是否成功 |
| message | string | 操作结果消息 |
| remaining | number | 剩余代币数量 |

**返回示例**：

```json
{
    "success": true,
    "message": "消耗成功",
    "remaining": 50
}
```

## 视频管理 API

### 获取视频列表

获取视频列表。

**请求地址**：`/video/list`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| current | number | 是 | 当前页码 |
| size | number | 是 | 每页数量 |

**返回示例**：

```json
{
    "records": [
        {
            "id": "1",
            "name": "示例视频",
            "url": "https://example.com/videos/1.mp4",
            "duration": 120
        }
    ],
    "total": 50
}
```

### 获取视频总数

获取视频总数。

**请求地址**：`/video/listCount`

**请求方法**：GET

**返回示例**：

```json
{
    "count": 50
}
```

### 重命名视频

重命名指定视频。

**请求地址**：`/video/rename/{id}`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 视频ID |
| name | string | 是 | 新的视频名称 |

**返回示例**：

```json
{
    "success": true,
    "message": "重命名成功"
}
```

### 删除视频

删除指定视频。

**请求地址**：`/video/del/{id}`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | string | 是 | 视频ID |

**返回示例**：

```json
{
    "success": true,
    "message": "删除成功"
}
```

## 音频管理 API

### 加载语音列表

获取可用的语音列表，包括 Edge TTS、RVC 和 GPT-SoVits 语音。

**请求地址**：`/audio/edge-tts-list`、`/audio/rvc-list`、`/audio/gpt-sovits-list`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| uid | string | 是 | 用户ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| type | string | 语音类型：edge（Edge TTS）、rvc（RVC）、gpt-sovits（GPT-SoVits） |
| name | string | 语音名称 |
| voice | string | 语音标识符（Edge TTS 特有） |
| model | string | 模型名称（RVC/GPT-SoVits 特有） |
| promptAudio | string | 提示音频URL（GPT-SoVits 特有） |
| promptText | string | 提示文本（GPT-SoVits 特有） |

**返回示例**：

```json
[
    {
        "type": "edge",
        "name": "Edge TTS 语音1",
        "voice": "zh-CN-XiaoxiaoNeural"
    },
    {
        "type": "rvc",
        "name": "RVC 语音1",
        "model": "model1",
        "voice": "voice1"
    },
    {
        "type": "gpt-sovits",
        "name": "GPT-SoVits 语音1",
        "model": "model1",
        "promptAudio": "https://example.com/download/prompt1.wav",
        "promptText": "示例提示文本"
    }
]
```

## 项目管理 API

### 获取项目列表

获取用户的所有项目列表。

**请求地址**：`/project`

**请求方法**：GET

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| pid | string | 项目唯一标识 |
| pname | string | 项目名称 |
| createTime | string | 项目创建时间（ISO 8601格式） |
| updateTime | string | 项目最后更新时间（ISO 8601格式） |

**返回示例**：

```json
[
    {
        "pid": "project1",
        "pname": "示例项目",
        "createTime": "2024-03-31T10:00:00Z",
        "updateTime": "2024-03-31T11:00:00Z"
    }
]
```

### 获取项目日志列表
获取指定项目的日志列表。

**请求地址**：`/project/log`

**请求方法**：GET

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pid | string | 是 | 项目ID |

**返回参数说明**：
| 参数名 | 类型 | 说明 |
|--------|------|------|
| logid | string | 日志唯一标识 |
| pid | string | 所属项目ID |
| content | string | 日志内容 |
| createTime | string | 日志创建时间（ISO 8601格式） |

**返回示例**：
```json
[
    {
        "logid": "log1",
        "pid": "project1",
        "content": "项目更新内容",
        "createTime": "2024-03-31T10:00:00Z"
    }
]
```

### 获取最新项目日志
获取指定项目的最新日志。

**请求地址**：`/project/log/newest`

**请求方法**：GET

**请求参数**：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pid | string | 是 | 项目ID |

**返回示例**：
```json
{
    "logid": "log1",
    "pid": "project1",
    "content": "最新项目更新内容",
    "createTime": "2024-03-31T11:00:00Z"
}
```

### 获取单个日志详情

获取指定日志的详细信息。

**请求地址**：`/project/log/{logid}`

**请求方法**：GET

**返回示例**：

```json
{
    "logid": "log1",
    "pid": "project1",
    "content": "日志详细内容",
    "createTime": "2024-03-31T10:00:00Z",
    "details": {
        "changes": ["修改1", "修改2"],
        "status": "completed"
    }
}
```

### 保存项目

保存项目信息。

**请求地址**：`/project/save`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| pid | string | 否 | 项目ID（新建时不需要） |
| pname | string | 是 | 项目名称 |
| data | object | 是 | 项目数据 |

**返回示例**：

```json
{
    "success": true,
    "message": "保存成功",
    "pid": "project1"
}
```

### 删除项目

删除指定项目。

**请求地址**：`/project/del/{pid}`

**请求方法**：POST

**返回示例**：
```json
{
    "success": true,
    "message": "删除成功"
}
```

## 批处理任务 API

### 获取最优批处理服务器

获取支持指定功能的批处理服务器。

**请求地址**：`/batch/getOptimumBatch/{support}`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| support | string | 是 | 所需支持的功能 |

**返回示例**：

```json
{
    "path": "https://batch-server.example.com",
    "support": ["tts", "subtitle", "video"]
}
```

### 文本转语音任务

执行文本转语音任务。

**请求地址**：`{batch.path}/tts-job`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| text | string | 是 | 要转换的文本 |
| voice | string | 是 | 语音类型 |
| speed | number | 否 | 语速（默认1.0） |
| pitch | number | 否 | 音调（默认1.0） |

**返回格式**：音频文件（Blob）

### 字幕生成任务

执行字幕生成任务。

**请求地址**：`{batch.path}/subtitle-job`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| video | string | 是 | 视频URL |
| language | string | 是 | 字幕语言 |
| format | string | 是 | 字幕格式（srt/vtt） |

**返回格式**：字幕文件（Blob）

### 获取任务步骤信息

获取批处理任务的步骤信息。

**请求地址**：`/batch/step/{jobId}`

**请求方法**：GET

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| jobId | string | 任务唯一标识 |
| steps | array | 任务步骤列表 |
| steps[].name | string | 步骤名称 |
| steps[].label | string | 步骤显示名称 |
| steps[].status | string | 步骤状态：completed（完成）、processing（处理中）、failed（失败） |
| steps[].progress | number | 步骤进度（0-100） |

**返回示例**：

```json
{
    "jobId": "job1",
    "steps": [
        {
            "name": "transparent-background-step",
            "label": "初始化背景",
            "status": "completed",
            "progress": 100
        },
        {
            "name": "unit-init-step",
            "label": "初始化元素",
            "status": "processing",
            "progress": 50
        }
    ]
}
```

### 获取任务列表

根据ID列表获取任务信息。

**请求地址**：`/jobs/listByIds/{ids}`

**请求方法**：GET

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | string | 任务唯一标识 |
| name | string | 任务名称 |
| status | string | 任务状态：completed（完成）、processing（处理中）、failed（失败） |
| createTime | string | 任务创建时间（ISO 8601格式） |
| completeTime | string | 任务完成时间（ISO 8601格式），仅当 status 为 completed 时返回 |

**返回示例**：

```json
[
    {
        "id": "job1",
        "name": "视频合成任务",
        "status": "completed",
        "createTime": "2024-03-31T10:00:00Z",
        "completeTime": "2024-03-31T11:00:00Z"
    }
]
```

## 视频合成 API

### 提交视频合成任务

提交视频合成任务到服务器进行处理。

**请求地址**：`/jobs/channel-synthesis-job/{title}`

**请求方法**：POST

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 视频标题 |
| options | object | 是 | 合成选项 |
| options.samplingRate | number | 是 | 音频采样率（默认：44100） |
| options.codeRate | string | 是 | 视频码率（默认：192k） |
| options.width | number | 是 | 视频宽度（默认：1920） |
| options.height | number | 是 | 视频高度（默认：1080） |
| options.codec | string | 是 | 视频编码器（默认：libx264） |
| options.fps | number | 是 | 帧率（默认：25） |
| options.units | array | 是 | 合成单元列表 |
| options.units[].type | string | 是 | 单元类型（main-audio/main-video/audio/video/image/figure） |
| options.units[].url | string | 是 | 资源URL（音频/视频/图片类型需要） |
| options.units[].duration | number | 是 | 持续时间（秒） |
| options.units[].start | number | 否 | 起始时间（音频/视频类型需要） |
| options.units[].end | number | 否 | 结束时间（音频/视频类型需要） |
| options.units[].anchor | number | 否 | 锚点时间（非主图层需要） |
| options.units[].scale | object | 否 | 缩放比例（视频/图片/数字人类型需要） |
| options.units[].overlay | object | 否 | 位置偏移（视频/图片/数字人类型需要） |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| jobId | string | 任务唯一标识 |
| status | string | 任务状态（processing/completed/failed） |
| message | string | 任务状态消息 |

**返回示例**：

```json
{
    "jobId": "job123",
    "status": "processing",
    "message": "任务已提交"
}
```

### 获取合成任务步骤信息

获取视频合成任务的详细步骤信息。

**请求地址**：`/batch/step/{jobId}`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| jobId | string | 是 | 任务ID |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| steps | array | 任务步骤列表 |
| steps[].name | string | 步骤名称 |
| steps[].label | string | 步骤显示名称 |
| steps[].status | string | 步骤状态（completed/processing/failed） |
| steps[].progress | number | 步骤进度（0-100） |

**返回示例**：

```json
{
    "steps": [
        {
            "name": "transparent-background-step",
            "label": "初始化背景",
            "status": "completed",
            "progress": 100
        },
        {
            "name": "unit-init-step",
            "label": "初始化元素",
            "status": "processing",
            "progress": 50
        }
    ]
}
```

### 获取任务列表

根据任务ID列表获取任务信息。

**请求地址**：`/jobs/listByIds/{ids}`

**请求方法**：GET

**请求参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ids | string | 是 | 任务ID列表，多个ID用逗号分隔 |

**返回参数说明**：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| id | string | 任务唯一标识 |
| name | string | 任务名称 |
| status | string | 任务状态（completed/processing/failed） |
| createTime | string | 任务创建时间（ISO 8601格式） |
| completeTime | string | 任务完成时间（ISO 8601格式，仅当status为completed时返回） |

**返回示例**：

```json
[
    {
        "id": "job123",
        "name": "视频合成任务",
        "status": "completed",
        "createTime": "2024-03-31T10:00:00Z",
        "completeTime": "2024-03-31T11:00:00Z"
    }
]
```

# 商品批量导入格式说明

本文档定义批量导入商品时的字段格式，便于与 Made-in-China 等平台数据对齐，并支持页面排布与图片一一对应。

---

## 一、字段列表与页面/图片对应关系

| 序号 | 字段名 | 中文名 | 说明 | 必填 | 页面展示 | 图片对应 |
|------|--------|--------|------|------|----------|----------|
| 1 | name | 名称 | 商品中文名称 | ✓ | 标题 | - |
| 2 | nameEn | 英文名 | 商品英文名称 | | 副标题/SEO | - |
| 3 | modelNo | 型号 | 如 FW-CS-0001 | | 规格表 | - |
| 4 | description | 描述 | 产品描述正文 | | 详情区 | - |
| 5 | categorySlug | 分类 | 分类 slug，如 flat-washer | | 面包屑/筛选 | - |
| 6 | images | 图片 | 多张图片 URL，顺序对应展示 | | 主图/图册 | **顺序对应** |
| 7 | material | 材质 | 如 Carbon Steel, 304 Stainless Steel | | 规格表 | - |
| 8 | standard | 标准 | 如 DIN 125, ISO, ASTM | | 规格表 | - |
| 9 | size | 规格 | 如 M3-M60, Customized | | 规格表 | - |
| 10 | surfaceTreatment | 表面处理 | 如 Zinc Plated, Oxide Black | | 规格表 | - |
| 11 | hardness | 硬度 | 如 Grade 4.8/8.8 | | 规格表 | - |
| 12 | application | 应用 | 如 Automotive, Construction | | 规格表 | - |
| 13 | seoTitle | SEO 标题 | 自定义 SEO 标题 | | meta | - |
| 14 | seoDesc | SEO 描述 | 自定义 SEO 描述 | | meta | - |

### 图片与展示顺序

- `images` 为有序数组，`images[0]` 为主图，`images[1]`、`images[2]`… 依次对应商品详情页的图册顺序。
- 填写时多张图片用分号 `;` 或竖线 `|` 分隔。

---

## 二、CSV / Excel 列顺序（简化版）

**最少 4 列**（兼容原有格式）：

```
名称,英文名,描述,分类slug
```

**完整列顺序**（推荐，与 Made-in-China 对齐）：

```
名称,英文名,型号,描述,分类slug,图片URL(分号分隔),材质,标准,规格,表面处理,硬度,应用,SEO标题,SEO描述
```

示例：

```csv
氧化黑热镀锌碳钢平垫圈,Oxide Black HDG Zinc Plated Flat Washer,FW-CS-0001,碳钢平垫圈 4.8/8.8 等级 工业用,flat-washer,https://img1.jpg;https://img2.jpg;https://img3.jpg,Carbon Steel,DIN 125;ISO,M3-M60,Zinc Plated;HDG,Grade 4.8/8.8,Automotive;Construction,,
304不锈钢DIN125镀锌平垫圈,304 Stainless Steel DIN 125 Zinc Plated,FW-SS-0001,304不锈钢平垫圈 镀锌,flat-washer,,Stainless Steel 304,DIN 125,M3-M60,Zinc Plated,,Machinery;Construction,,
```

---

## 三、Excel 表头（支持中英混合）

第一行可为表头，系统自动识别以下列名：

| 中文 | 英文 | 字段 |
|------|------|------|
| 名称 | name | name |
| 英文名 | nameEn, name_en | nameEn |
| 型号 | modelNo, model_no | modelNo |
| 描述 | description, 描述 | description |
| 分类 | category, categorySlug | categorySlug |
| 图片 | images | images |
| 材质 | material | material |
| 标准 | standard | standard |
| 规格 | size | size |
| 表面处理 | surfaceTreatment | surfaceTreatment |
| 硬度 | hardness | hardness |
| 应用 | application | application |
| SEO标题 | seoTitle | seoTitle |
| SEO描述 | seoDesc | seoDesc |

---

## 四、JSON 格式

```json
[
  {
    "name": "氧化黑热镀锌碳钢平垫圈",
    "nameEn": "Oxide Black HDG Zinc Plated Grade 4.8/8.8 Carbon Steel Flat Washer",
    "modelNo": "FW-CS-0001",
    "description": "碳钢平垫圈 工业用...",
    "categorySlug": "flat-washer",
    "images": ["https://img1.jpg", "https://img2.jpg", "https://img3.jpg"],
    "material": "Carbon Steel",
    "standard": "DIN 125A; DIN9021; ISO",
    "size": "M3-M60; Customized",
    "surfaceTreatment": "Zinc Plated; Oxide Black; HDG",
    "hardness": "Grade 4.8/ 6.8/ 8.8",
    "application": "Mechanical Manufacturing, Automobiles, Construction"
  }
]
```

或使用 `specs` 对象（会合并到规格表）：

```json
{
  "name": "商品名称",
  "specs": {
    "material": "Carbon Steel",
    "standard": "DIN 125",
    "size": "M3-M60",
    "surfaceTreatment": "Zinc Plated",
    "application": "Automotive"
  },
  "images": ["url1", "url2"]
}
```

---

## 五、规格表（specs）存储结构

以下字段会合并为 `specs` 存入数据库，用于详情页规格表展示：

```json
{
  "material": "Carbon Steel",
  "standard": "DIN 125; ISO",
  "size": "M3-M60",
  "surfaceTreatment": "Zinc Plated",
  "hardness": "Grade 4.8/8.8",
  "application": "Automotive; Construction",
  "modelNo": "FW-CS-0001"
}
```

页面可据此排布：每行一个 key-value，与商品主图、图册一一对应展示。

---

## 六、参考：Made-in-China 产品页结构

参考 [Better Fastener 中国制造网店铺](https://betterfastener.en.made-in-china.com/) 产品页：

- **标题**：name / nameEn
- **型号**：modelNo
- **Basic Info**：Type, Material, Standard → material, standard
- **Specification 表**：Standards, Surface Treatment, Material, Size, Hardness, Application → 对应 specs
- **图片**：多张产品图，顺序对应 images 数组

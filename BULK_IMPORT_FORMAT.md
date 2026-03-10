# 商品批量导入格式说明

本文档定义批量导入商品时的字段格式，便于与 Made-in-China 等平台数据对齐。

> **图片单独上传**：批量导入仅处理商品文字信息，不包含图片。图片通过商品编辑页的「图片管理」单独上传。

---

## 一、字段列表（批量导入不含图片）

| 序号 | 字段名 | 中文名 | 说明 | 必填 |
|------|--------|--------|------|------|
| 1 | name | 名称 | 商品中文名称 | ✓ |
| 2 | nameEn | 英文名 | 商品英文名称 | |
| 3 | modelNo | 型号 | 如 FW-CS-0001 | |
| 4 | description | 描述 | 产品描述正文 | |
| 5 | categorySlug | 分类 | 分类 slug，如 flat-washer | |
| 6 | material | 材质 | 如 Carbon Steel | |
| 7 | standard | 标准 | 如 DIN 125, ISO | |
| 8 | size | 规格 | 如 M3-M60 | |
| 9 | surfaceTreatment | 表面处理 | 如 Zinc Plated | |
| 10 | hardness | 硬度 | 如 Grade 4.8/8.8 | |
| 11 | application | 应用 | 如 Automotive, Construction | |
| 12 | seoTitle | SEO 标题 | 自定义 SEO 标题 | |
| 13 | seoDesc | SEO 描述 | 自定义 SEO 描述 | |

---

## 二、CSV / Excel 列顺序

**最少 4 列**（兼容原有格式）：`名称,英文名,描述,分类slug`

**完整列顺序**（不含图片）：

```
名称,英文名,型号,描述,分类slug,材质,标准,规格,表面处理,硬度,应用,SEO标题,SEO描述
```

示例：

```csv
氧化黑热镀锌碳钢平垫圈,Oxide Black HDG Flat Washer,FW-CS-0001,碳钢平垫圈 工业用,flat-washer,Carbon Steel,DIN 125;ISO,M3-M60,Zinc Plated;HDG,Grade 4.8/8.8,Automotive;Construction,,
304不锈钢DIN125镀锌平垫圈,304 Stainless Steel DIN 125,FW-SS-0001,304不锈钢平垫圈,flat-washer,Stainless Steel 304,DIN 125,M3-M60,Zinc Plated,,Machinery;Construction,,
```

---

## 三、Excel 表头（支持中英混合）

第一行可为表头，系统自动识别：名称、英文名、型号、描述、分类、材质、标准、规格、表面处理、硬度、应用、SEO标题、SEO描述。

---

## 四、JSON 格式（不含 images）

```json
[
  {
    "name": "氧化黑热镀锌碳钢平垫圈",
    "nameEn": "Oxide Black HDG Carbon Steel Flat Washer",
    "modelNo": "FW-CS-0001",
    "description": "碳钢平垫圈 工业用...",
    "categorySlug": "flat-washer",
    "material": "Carbon Steel",
    "standard": "DIN 125A; ISO",
    "size": "M3-M60; Customized",
    "surfaceTreatment": "Zinc Plated; HDG",
    "hardness": "Grade 4.8/8.8",
    "application": "Mechanical, Automobiles, Construction"
  }
]
```

---

## 五、图片上传（单独逻辑）

图片不参与批量导入，在**商品编辑页**的「图片管理」中单独上传：

- 粘贴图片 URL 添加
- 本地上传（需配置 Vercel Blob 的 `BLOB_READ_WRITE_TOKEN`）
- 支持拖拽排序、删除

---

## 六、规格表（specs）存储结构

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

## 七、参考：Made-in-China 产品页结构

参考 [Better Fastener 中国制造网店铺](https://betterfastener.en.made-in-china.com/) 产品页：

- **标题**：name / nameEn
- **型号**：modelNo
- **Basic Info**：Type, Material, Standard → material, standard
- **Specification 表**：Standards, Surface Treatment, Material, Size, Hardness, Application → 对应 specs
- **图片**：多张产品图，顺序对应 images 数组

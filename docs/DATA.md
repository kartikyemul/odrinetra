# Choosing and crediting a dataset

**Where to look (free):** Roboflow Universe (search "pothole" or "road damage"), Kaggle datasets, and public road-damage research datasets.

**Before you use one**
1. Read its licence. Make sure it allows your use, and note whether it needs credit.
2. Check the format is YOLOv8 (images plus one `.txt` label file per image), or can be exported as that.
3. Look at 20 random images. Wrong or missing boxes cost more accuracy than a small dataset does.
4. Keep the images out of git. `datasets/` is already ignored.

**What helps accuracy:** variety (day, night, wet roads, shadows, different surfaces and cameras) matters more than piling up near-identical photos.

**Classes:** the class names and their order in the dataset must match `src/labels.ts`. One class works too, for example `['pothole']`. The app adapts to any number of classes, and it stops with a clear message if the model and the labels list disagree.

## Credit table (fill in what you use)

| Dataset | Link | Licence | Images | Classes |
|---|---|---|---|---|
|  |  |  |  |  |

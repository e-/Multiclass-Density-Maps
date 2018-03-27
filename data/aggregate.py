import json
import numpy as np

def aggregate(names, output):
    hists = []

    for name in names:
        inf = open(name)
        
        result = json.load(inf)
        hists.append(result)
        inf.close()

    outf = open(output, "w", encoding="utf8")

    json.dump(np.array(hists).sum(axis=0).tolist(), outf)

    outf.close()


aggregate(["census.snappy_cat_b.json", "census.snappy_cat_h.json", 
"census.snappy_cat_a.json", "census.snappy_cat_o.json"], "census.snappy_cat_haob.json")

aggregate(["census.snappy_cat_b.json", "census.snappy_cat_a.json", 
"census.snappy_cat_o.json"], "census.snappy_cat_aob.json")

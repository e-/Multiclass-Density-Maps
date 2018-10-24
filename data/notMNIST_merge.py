import pandas as pd

df_labels = pd.read_csv('notMNIST.csv', delimiter=' ', usecols=['label'])
df_2d = pd.read_csv('notMNIST_vec2D.txt', delimiter=' ', names=['x', 'y'], skiprows=1)
df_2d['label'] = df_labels['label']
df_2d.to_csv('notMNIST_xylab.csv', sep=',')

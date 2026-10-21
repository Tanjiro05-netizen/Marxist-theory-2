from pathlib import Path
import os, runpy, shutil
root = Path(__file__).resolve().parent
os.chdir(root)
runpy.run_path('work/enhance.py')
target = root.parents[2] / 'public' / 'readers' / 'digital-twin' / 'index.html'
target.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2('outputs/The Digital Twin — Enhanced.html', target)
print('Website file:', target)

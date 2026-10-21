from pathlib import Path

p = Path('outputs/The Digital Twin — Enhanced.html')
s = p.read_text()
s = s.replace('</style>', Path('work/inline-mirrors.css').read_text() + '\n</style>', 1)
diagrams = Path('work/inline-mirrors.js').read_text()
diagrams = diagrams.replace('  const specs=[', Path('work/engine-experiment.js').read_text() + '\n  const specs=[')
s = s.replace('</script>\n</body>', diagrams + '\n</script>\n</body>')
# The retained figure index describes the new inline anchors as well.
s = s.replace("define('twin',81,", "define('twin',92,")
# The dormant side panel stays out of keyboard and screen-reader navigation.
s = s.replace('id="mir" role="region"', 'id="mir" inert aria-hidden="true" role="region"')
p.write_text(s)
print('Added three inline animated diagrams')

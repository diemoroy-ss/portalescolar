const fs = require('fs');
const filePath = 'c:/Users/diemo/Desktop/Apps/portalescolar/src/features/admin/AdminPage.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Form wrapping class
content = content.replace(
  '<form onSubmit={handleCreateAlumno} className="space-y-6 text-neutral-800">',
  '<form onSubmit={handleCreateAlumno} className="space-y-6 text-neutral-100">'
);
content = content.replace(
  '<form onSubmit={handleUpdateAlumno} className="space-y-6 text-neutral-800">',
  '<form onSubmit={handleUpdateAlumno} className="space-y-6 text-neutral-100">'
);

// 2. Fieldsets bg-white -> bg-surface-2/30 and border-neutral-200 -> border-surface-3
content = content.replaceAll(
  '<fieldset className="border border-neutral-200 rounded-xl p-4 space-y-4 bg-white">',
  '<fieldset className="border border-surface-3 rounded-xl p-4 space-y-4 bg-surface-2/30">'
);

// 3. Legends text-neutral-600 -> text-neutral-200
content = content.replaceAll(
  '<legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-600">',
  '<legend className="text-xs font-bold px-2 uppercase tracking-wider text-neutral-200">'
);

// 4. Parents h4 header text-neutral-600 -> text-neutral-300
content = content.replaceAll(
  '<h4 className="text-xs font-bold text-neutral-600 uppercase">Datos de los Padres o Apoderados</h4>',
  '<h4 className="text-xs font-bold text-neutral-300 uppercase">Datos de los Padres o Apoderados</h4>'
);

// 5. Select labels text-neutral-500 -> text-neutral-400
content = content.replaceAll(
  '<label className="text-xs font-semibold text-neutral-500">',
  '<label className="text-xs font-semibold text-neutral-400">'
);
content = content.replaceAll(
  '<label className="text-2xs font-semibold text-neutral-500">',
  '<label className="text-2xs font-semibold text-neutral-400">'
);

// 6. Select tags: bg-white text-neutral-880/800 -> bg-surface-1 border-surface-3 text-neutral-100
content = content.replaceAll(
  'className="w-full bg-white border border-neutral-300 text-sm rounded-xl px-3 py-2 text-neutral-800 focus:outline-none"',
  'className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"'
);
content = content.replaceAll(
  'className="w-full bg-white border border-neutral-300 text-sm rounded-xl px-3 py-2 text-neutral-880 focus:outline-none"',
  'className="w-full bg-surface-1 border border-surface-3 text-sm rounded-xl px-3 py-2 text-neutral-100 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"'
);

// 7. Divider lines border-neutral-200 -> border-surface-3
content = content.replaceAll(
  '<div className="flex-grow border-t border-neutral-200"></div>',
  '<div className="flex-grow border-t border-surface-3"></div>'
);
content = content.replaceAll(
  '<span className="flex-shrink mx-4 text-neutral-400 text-3xs font-bold uppercase">Datos del Apoderado Ficha</span>',
  '<span className="flex-shrink mx-4 text-primary-400 text-3xs font-bold uppercase">Datos del Apoderado Ficha</span>'
);
content = content.replaceAll(
  '<span className="flex-shrink mx-4 text-neutral-400 text-3xs font-bold uppercase">O registrar apoderado nuevo en sistema</span>',
  '<span className="flex-shrink mx-4 text-primary-400 text-3xs font-bold uppercase">O registrar apoderado nuevo en sistema</span>'
);

// 8. Checkbox parent labels text-neutral-600 -> text-neutral-300
content = content.replaceAll(
  'className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-600"',
  'className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-300"'
);

// 9. Checkbox inputs className bg-white -> bg-surface-1 border-surface-3
content = content.replaceAll(
  'className="rounded border-neutral-300 text-primary-600 bg-white"',
  'className="rounded border-surface-3 text-primary-600 bg-surface-1"'
);

// 10. Footer border-neutral-200 -> border-surface-3
content = content.replaceAll(
  '<div className="flex gap-2 justify-end pt-3 border-t border-neutral-200">',
  '<div className="flex gap-2 justify-end pt-3 border-t border-surface-3">'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminPage.tsx updated successfully!');

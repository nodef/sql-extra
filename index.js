// 0. @sql-extra/createindex (createIndex)
function createIndex(nam, tab, exp, opt={}) {
  var z = `CREATE INDEX IF NOT EXISTS "${nam}" ON "${tab}" `;
  if(opt.method) z += `USING ${opt.method} `;
  return z+`(${exp});\n`;
};
// 1. @sql-extra/createtable (createTable)
function createTable(nam, cols, opt={}) {
  var z = `CREATE TABLE IF NOT EXISTS "${nam}" (`;
  for(var k in cols)
    z += `"${k}" ${cols[k]}, `;
  if(opt.pk) z += `PRIMARY KEY("${opt.pk}"), `;
  return z.replace(/, $/, '')+`);\n`;
};
// 2. @sql-extra/createview (createView)
function createView(nam, qry) {
  return `CREATE OR REPLACE VIEW "${nam}" AS ${qry};\n`;
};
// 3. @sql-extra/insertinto (insertInto)
function insertInto(tab, vals, opt={}) {
  var i = -1, z = `INSERT INTO "${tab}" (`;
  for(var val of vals) {
    if(++i===0) {
      for(var k in val)
        z += `"${k}", `;
      z = z.replace(/, $/, '')+') VALUES\n(';
    }
    for(var k in val)
      z += `'${val[k]}', `;
    z = z.replace(/, $/, '')+'),\n(';
  }
  z = z.replace(/\),\n\($/, '')+')';
  if(opt.pk) z += `\nON CONFLICT ("${opt.pk}") DO NOTHING`;
  return z+';\n';
};
// 4. @sql-extra/setuptable (setupTable)
const COMMAND_DEFAULT4 = 'create table, create index, create view, insert into';
const CREATE_TABLE4 = /create\s*table/i;
const CREATE_INDEX4 = /create\s*index/i;
const CREATE_VIEW4 = /create\s*view/i;
const INSERT_INTO4 = /insert\s*into/i;

function setupTable(nam, cols, vals=null, opt={}) {
  var cmd = opt.command||COMMAND_DEFAULT4;
  var z = CREATE_TABLE4.test(cmd)? createTable(nam, cols, opt):'';
  if(vals && INSERT_INTO4.test(cmd)) z += insertInto(nam, vals, opt);
  if(opt.tsvector) {
    var tv = tsvector(opt.tsvector);
    if(CREATE_VIEW4.test(cmd)) z += createView(nam+'_tsvector', `SELECT *, ${tv} AS "tsvector" FROM "${nam}"`);
    if(opt.index && CREATE_INDEX4.test(cmd)) z += createIndex(nam+'_tsvector_idx', nam, `(${tv})`, {method: 'GIN'});
  }
  if(opt.index && CREATE_INDEX4.test(cmd)) {
    for(var k in cols) {
      if(cols[k]==null || cols[k]===opt.pk) continue;
      var knam = k.replace(/\W+/g, '_').toLowerCase();
      z += createIndex(`${nam}_${knam}_idx`, nam, `"${k}"`);
    }
  }
  return z;
};
// 5. @sql-extra/tableexists (tableExists)
function tableExists(nam) {
  return `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='${nam}');\n`;
};
// 6. @sql-extra/tsvector (tsvector)
function tsvector(cols) {
  var z = '';
  for(var k in cols)
    if(cols[k]) z += `setweight(to_tsvector('english', "${k}"), '${cols[k]}')||`;
  return z.replace(/\|\|$/, '');
};
exports.createIndex = createIndex;
exports.createTable = createTable;
exports.createView = createView;
exports.insertInto = insertInto;
exports.setupTable = setupTable;
exports.tableExists = tableExists;
exports.tsvector = tsvector;

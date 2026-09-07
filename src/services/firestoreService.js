import { db } from '../firebase'
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore'

export async function salvarPeriodo(periodo, dados) {
  const colName = 'colaboradores_' + periodo.replace('-', '_')
  const col = collection(db, colName)

  const loteSize = 50
  for (let i = 0; i < dados.length; i += loteSize) {
    const lote = dados.slice(i, i + loteSize)
    await Promise.all(lote.map(row => addDoc(col, { ...row, periodo })))
  }

  const metaCol = collection(db, 'periodos')
  await addDoc(metaCol, {
    periodo,
    total: dados.length,
    importadoEm: new Date().toISOString()
  })
}

export async function buscarPeriodos() {
  const snap = await getDocs(
    query(collection(db, 'periodos'), orderBy('periodo', 'desc'))
  )
  const periodos = []
  snap.forEach(doc => {
    const d = doc.data()
    if (!periodos.find(p => p.periodo === d.periodo)) {
      periodos.push(d)
    }
  })
  return periodos
}

export async function buscarDadosPeriodo(periodo) {
  const colName = 'colaboradores_' + periodo.replace('-', '_')
  const snap = await getDocs(collection(db, colName))
  const dados = []
  snap.forEach(doc => dados.push(doc.data()))
  return dados
}

export async function excluirPeriodo(periodo) {
  const colName = 'colaboradores_' + periodo.replace('-', '_')

  // Exclui registros em lotes de 400
  const snap = await getDocs(collection(db, colName))
  const docs = []
  snap.forEach(d => docs.push(d.id))

  const loteSize = 400
  for (let i = 0; i < docs.length; i += loteSize) {
    const batch = writeBatch(db)
    const lote = docs.slice(i, i + loteSize)
    lote.forEach(id => batch.delete(doc(db, colName, id)))
    await batch.commit()
  }

  // Exclui metadado do período
  const metaSnap = await getDocs(collection(db, 'periodos'))
  const metaBatch = writeBatch(db)
  metaSnap.forEach(d => {
    if (d.data().periodo === periodo) metaBatch.delete(doc(db, 'periodos', d.id))
  })
  await metaBatch.commit()
}

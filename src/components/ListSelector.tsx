import { List } from '@typings/index'

interface ListSelectorProps {
  lists: List[]
  currentList: List | null
  onChange: (list: List) => void
  loading?: boolean
}

const ListSelector = ({
  lists,
  currentList,
  onChange,
  loading = false
}: ListSelectorProps) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Cargando listas...
        </span>
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          No tienes listas disponibles
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 relative z-[60]">
      <label
        htmlFor="list-selector"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Lista:
      </label>
      <select
        id="list-selector"
        value={currentList?.id || ''}
        onChange={(e) => {
          const selectedList = lists.find((list) => list.id === e.target.value)
          if (selectedList) {
            onChange(selectedList)
          }
        }}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
      >
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default ListSelector

import { memo } from 'react'
import classnames from 'classnames'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { RiSafeLine, RiSwapLine, RiDashboard3Line } from 'react-icons/ri'

const navLinks = [
  ['/', 'Vaults', RiSafeLine],
  ['/swap', 'Swap', RiSwapLine],
  ['/dashboard', 'Dashboard', RiDashboard3Line]
]

const TabbarItem = ({ href, label, Icon, active }) => (
  <Link href={href}>
    <a
      className={classnames(
        'p-2 flex flex-col items-center',
        active ? '' : 'text-gray-500 dark:text-gray-400'
      )}
     >
      <Icon className="text-xl" />
      <div className="text-xs font-semibold">{label}</div>
    </a>
  </Link>
)

const Tabbar = () => {
  const router = useRouter()
  return (
    <div className="sm:hidden sticky bottom-0 pb-safe inset-x-0 bottom-0 bg-white dark:bg-gray-900
      border-t border-gray-200 dark:border-gray-800 grid grid-cols-3 z-50"
    >
      {navLinks.map(([href, label, Icon]) =>
        <TabbarItem
          key={href}
          href={href}
          label={label}
          Icon={Icon}
          active={href === router.pathname}
        />
      )}
    </div>
  )
}

export default memo(Tabbar)


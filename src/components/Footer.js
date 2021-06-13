import React, { memo } from 'react'
import { chainsById } from 'constants/chains'
import {
  FaTelegram,
  FaMedium,
  FaTwitter,
  FaDiscord
} from 'react-icons/fa'

const email = 'hello@autofarm.network'
const supportEmail = 'support@autofarm.network'

const Footer = ({ chainId }) => {
  const chain = chainsById[chainId]
  const links = [
    ["https://github.com/autofarm-network/autofarm_audits/raw/main/CertiK%20Audit%20Report%20280321.pdf", 'Audit'],
    ["https://github.com/autofarm-network/autofarmV2", 'Github'],
    [chain.blockExplorerURLBase + "address/" + chain.autoFarmContractAddress, 'Contract'],
    ["https://autofarm.gitbook.io/autofarm-network/", 'Wiki'],
  ]
  const socialLinks = [
    ["https://t.me/autofarm_network", <FaTelegram className="inline-block" />],
    ["https://medium.com/autofarm-network", <FaMedium className="inline-block" />],
    ["https://twitter.com/autofarmnetwork", <FaTwitter className="inline-block" />],
    ["https://discord.gg/bJ9ZsypQzv", <FaDiscord className="inline-block" />],
  ]
  return (
    <div className="pb-safe border-t dark:border-gray-800">
      <div className="max-w-4xl pb-24 m-auto px-3 py-8 sm:py-12 flex flex-col lg:flex-row justify-between space-y-6 lg:space-y-0">
        <div className="">
          <div className="text-lg lg:text-xl mb-2 font-semibold">Contact Us</div>
          <div className="flex flex-col text-sm sm:text-base space-y-2">
            <p className="flex-auto"><span className="font-semibold">Business Enquiries</span><br/><a href={`mailto:${email}`}>{email}</a></p>
            <p className="flex-auto"><span className="font-semibold">Customer Support</span><br /> <a href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
          </div>
        </div>
        <div className="">
          <div className="text-lg lg:text-xl lg:mb-2 font-semibold">Learn More</div>
          <div className="flex space-x-5">
            { links.map(([url, label]) => (
              <a key={url} className="text-sm lg:text-base" href={url} target="_blank" rel="noreferrer">{label}</a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-lg lg:text-xl lg:mb-2 font-semibold">Join Community</div>
          <div className="flex space-x-5">
            { socialLinks.map(([url, label]) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="text-lg lg:text-xl">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(Footer)


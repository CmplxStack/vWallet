import { computed, decorate, observable } from 'mobx'

import { WalletInfo } from 'verge-node-typescript/dist/WalletInfo'
import electronLog from 'electron-log'

import VergeClient from './VergeClient'

const getAccountInfo = () =>
  VergeClient.getInfo()
    .then(info =>
      VergeClient.getPeerInfo().then(peers => {
        const highestBlock = Math.max(...peers.map(peer => peer.startingheight))
        return VergeClient.unlockWallet('a')
          .then(() => ({ ...info, highestBlock, unlocked: true }))
          .catch(e => {
            return {
              ...info,
              highestBlock,
              unlocked: e.includes('already unlocked'),
            }
          })
      }),
    )
    .catch(electronLog.error)

interface Info extends WalletInfo {
  highestBlock: number
  unlocked?: boolean
}

export class AccountInformationStore {
  info: Info = <Info>{}

  constructor() {
    setInterval(() => {
      getAccountInfo()
        .then(info => {
          this.info = { ...this.info, ...info }
        })
        .catch(electronLog.error)
    }, 5000)
  }

  sendTransaction(vergeAddress, amount) {
    return VergeClient.sendToAddress(vergeAddress, amount)
  }

  unlockWallet(password) {
    return VergeClient.unlockWallet(password)
  }

  lockWallet() {
    return VergeClient.walletLock()
  }

  get getUpdatedInfo() {
    return this.info
  }

  get getBalance() {
    return this.info.balance || 0
  }

  get unlocked() {
    return this.info.unlocked || false
  }
}

decorate(AccountInformationStore, {
  info: observable.struct,
  getUpdatedInfo: computed,
  getBalance: computed,
  unlocked: computed,
})

const store = new AccountInformationStore()
export default store

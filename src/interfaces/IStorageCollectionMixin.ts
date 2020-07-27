/***************************************************
 * Created by nanyuantingfeng on 2020/6/2 12:42. *
 ***************************************************/
import { PureCollection } from 'datx'
import { IReactionDisposer } from 'mobx'

export interface IStorageCollectionMixin<T = PureCollection> {
  load(): this
  recording(): IReactionDisposer
}

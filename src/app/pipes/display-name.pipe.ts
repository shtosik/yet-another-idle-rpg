import { Pipe, PipeTransform } from '@angular/core'
import { displayName, NameFamily } from '../i18n/names'

/** `{{ item.id | displayName:'item' }}`; items take an optional **Upgrade level**: `| displayName:'item':level`. */
@Pipe({ name: 'displayName', pure: false })
export class DisplayNamePipe implements PipeTransform {
  transform(id: number, family: NameFamily, level = 0): string {
    return displayName(family, id, level)
  }
}

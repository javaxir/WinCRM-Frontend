import i18n from '@/i18n'

export function translatePermission(name: string): string {
  const { t, te } = i18n.global
  const exactKey = `permissionCodes.${name}`
  if (te(exactKey)) {
    return t(exactKey)
  }

  const match = name.match(/^(.+)_(VIEW|EDIT|DELETE|CREATE)$/)
  if (!match) {
    return name
  }

  const [, entityKey, actionKey] = match
  const entity = te(`permissionEntities.${entityKey}`)
    ? t(`permissionEntities.${entityKey}`)
    : entityKey.replace(/_/g, ' ')
  const action = te(`permissionActions.${actionKey}`)
    ? t(`permissionActions.${actionKey}`)
    : actionKey

  return t('permissionPattern', { entity, action })
}

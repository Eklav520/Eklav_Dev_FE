export type ThemeType = 'light' | 'dark' | 'auto'

export type DialogControlType = {
  open: boolean
  toggle: () => void
}

export type LayoutState = {
  theme: ThemeType
}

export type LayoutType = LayoutState & {
  appMenuControl: DialogControlType
  changeTheme: (theme: ThemeType) => void
}

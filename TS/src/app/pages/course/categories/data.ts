import arFlag from '@/assets/images/flags/ar.svg'
import frFlag from '@/assets/images/flags/fr.svg'
import grFlag from '@/assets/images/flags/gr.svg'
import inFlag from '@/assets/images/flags/in.svg'
import itFlag from '@/assets/images/flags/nz.svg'
import spFlag from '@/assets/images/flags/sp.svg'
import ukFlag from '@/assets/images/flags/uk.svg'

type LanguageType = {
  name: string
  flag: string
}

export const languages: LanguageType[] = [
  {
    name: 'French',
    flag: frFlag,
  },
  {
    name: 'German',
    flag: grFlag,
  },
  {
    name: 'Español',
    flag: spFlag,
  },
  {
    name: 'English',
    flag: ukFlag,
  },
  {
    name: 'Hindi',
    flag: inFlag,
  },
  {
    name: 'Italian',
    flag: itFlag,
  },
  {
    name: 'Arabic',
    flag: arFlag,
  },
  {
    name: 'English',
    flag: ukFlag,
  },
]

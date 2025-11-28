const regexPattern = {
  urlLink: {
    value:
      // eslint-disable-next-line no-useless-escape
      /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
    message: "لطفا لینک معتبر وارد کنید",
  },
  onlyEnglishNdOtherCharacters: {
    value: /^(?!.*[\u0600-\u06E9\u200C])/,
    message: "لطفا فقط از حروف انگلیسی استفاده کنید",
  },
  lessThan50: {
    value: /^[0-9][0-9]?$|^50$/,
    message: "اعداد بین صفر الی صد وارد کنید",
  },
  lessThan100: {
    value: /^[0-9][0-9]?$|^100$/,
    message: "اعداد بین صفر الی صد وارد کنید",
  },
  lettersDashUnderLineSpace: {
    value: /^[a-zA-Z\-_]*$/i,
    message: "لطفاً فقط از حروف انگلیسی استفاده کنید(عدد مجاز نمی‌باشد)",
  },
  lettersDashSpace: {
    value: /^[a-zA-Z-/]*$/i,
    message: "لطفاً فقط از حروف انگلیسی استفاده کنید(عدد مجاز نمی‌باشد)",
  },
  lettersEnglishSpace: {
    value: /^[a-zA-Z-_0-9]*$/i,
    message:
      "لطفاً فقط از حروف انگلیسی و اعداد استفاده کنید(کاراکتر های مجاز - و _)",
  },
  enCharAndNumber: {
    value: /^[A-Za-z0-9]*$/,
    message: "فقط حروف انگلیسی و اعداد",
  },
  lettersDashUnderLineNumbers: {
    value: /^[A-Za-z0-9-_]*[A-Za-z0-9][A-Za-z0-9-_]*$/,
    message: "فقط حروف انگلیسی و - و _ و اعداد",
  },
  gitUrl: {
    value:
      // eslint-disable-next-line no-useless-escape
      /^(([A-Za-z0-9]+@|http(|s)\:\/\/)|(http(|s)\:\/\/[A-Za-z0-9]+@))([A-Za-z0-9.]+(:\d+)?)(?::|\/)([\d\/\w.-]+?)(\.git){1}$/i,
    message:
      "آدرس گیت باید همان آدرسی باشد که برای کلون کردن استفاده میشود و به .git ختم شود.",
  },
  smallLettersThenNumbers: {
    value: /^[a-z][a-z0-9-_ ]*$/gm,
    message:
      "نام پوشه حتما باید حروف کوچک انگلیسی باشد و نباید با عدد شروع شود",
  },
  farsiLetters: {
    value: /[ا-ی]/gi,
    message: "نام و نام‌خانوادگی خود را به فارسی وارد کنید",
  },
  accountNumber: {
    value: /[0-9-]{9,16}/,
    message: "شماره حساب اشتباه است",
  },
  farsiLettersAndSpace: {
    value: /^[ آابپتثجچحخدذرزژسشصضطظعغفقکگلمنوهیئ\u200c\s]+$/,
    message: "باید فارسی باشد",
  },
  email: {
    value:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    message: "فرمت ایمیل را به درستی و کامل وارد کنید",
  },
  emailAndPhoneNumber: {
    value:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))|[09|۰۹][0-9|۰۱۲۳۴۵۶۷۸۹]{10}$/,
    message: "",
  },
  // ۰۱۲۳۴۵۶۷۸۹ mac number
  phoneNumber: {
    value: /^[09|۰۹][0-9|۰۱۲۳۴۵۶۷۸۹]{10}$/,
    message: "فرمت صحیح موبایل: 09xxxxx1234",
  },
  phoneNumber2: {
    value: /^09[0-3][0-9]-?[0-9]{3}-?[0-9]{4}$/,
    message: "فرمت صحیح موبایل: 09xxxxx1234",
  },
  phoneNumberNoZeroAtStart: {
    value: /^[9|۹][0-9|۰۱۲۳۴۵۶۷۸۹]{9}$/,
    message: "فرمت صحیح موبایل: 9xxxxx1234",
  },
  englishLetter: {
    value: /^[a-zA-Z]+$/,
    message: "لطفا فقط از حروف انگلیسی استفاده کنید",
  },
  farsiLetter: {
    value: /^[\u0600-\u06E9\u200C]+$/,
    message: "لطفا فقط از حروف فارسی استفاده کنید",
  },
  numbers: {
    value: /^[۰-۹٠-٩0-9]+$/,
    message: "لطفا فقط از اعداد استفاده کنید",
  },
  en_spc: {
    value: /^[a-zA-Z\s]+$/,
    message: "لطفا فقط از حروف انگلیسی و فاصله استفاده کنید",
  },
  fa_spc: {
    value: /^[\u0600-\u06FF\s\u200C]+$/,
    message: "لطفا فقط از حروف فارسی و فاصله استفاده کنید",
  },
  lettersLenght3: {
    value: /[A-Za-z]{3}/,
    message: "checkpatern",
  },
  eightchar_number_lower_uppercase: {
    value:
      /(?=^.{8,64}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    message: "باید حداقل 8 کاراکتر و حاوی حروف بزرگ و کوچک لاتین باشد.",
  },
  password: {
    value: /(?=^.{8,64}$)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    message: "گذرواژه باید حداقل 8 کاراکتر و حاوی حروف بزرگ و کوچک لاتین باشد.",
  },
  required: {
    value: true,
    message: "درج این فیلد ضروریست.",
  },
  jsonValidate: {
    value: /[^\0-9]/,
    message: "باشد json فرمت باید",
  },
  dockerImage: {
    value:
      // eslint-disable-next-line no-useless-escape
      /^(?:(?=[^:\/]{4,253})(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(?:\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))*(?::[0-9]{1,5})?\/)?((?![._-])(?:[a-z0-9._-]*)(?<![._-])(?:\/(?![._-])[a-z0-9._-]*(?<![._-]))*)(?::(?![.-])[a-zA-Z0-9_.-]{1,128})?$/,
    message: "آدرس داکر ایمیج صحیح نمیباشد.",
  },
  spaceFarstCharacter: {
    value: /^[^\s].*/,
    message: "فاصله مجاز نیست.",
  },
  cardNumber: {
    value: /^[۰-۹٠-٩0-9--]+$/,
    message: "فقط از اعداد استفاده کنید",
  },
  price: {
    value: /^[۰-۹٠-٩0-9-,]+$/,
    message: "لطفا فقط از اعداد استفاده کنید",
  },
};

export function enCharNumberUnderline(label?: string) {
  return {
    value: /^[a-zA-Z_0-9]*$/i,
    message: `${label || "این فیلد"} تنها حروف لاتین،اعداد و _ را می پذیرد.`,
  };
}

export default regexPattern;

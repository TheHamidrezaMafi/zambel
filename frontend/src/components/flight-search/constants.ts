export const flightDirectionList = [
  { label: 'پرواز داخلی', value: 'domestic' },
  { label: 'پرواز خارجی', value: 'international' },
];

export const flightTypeList = [
  { label: 'یک طرفه', value: 'one-way' },
  { label: 'رفت و برگشت', value: 'round-trip' },
];

export const providerNameList = [
  { label: 'پته', value: 'pateh' },
  { label: 'مستر بلیط', value: 'mrbilit' },
  { label: 'فلای تودی', value: 'flytoday' },
  { label: 'علی بابا', value: 'alibaba' },
  { label: 'سفرمارکت', value: 'safarmarket' },
  { label: 'سفر۳۶۶', value: 'safar366' },
];

export const getProviderLogo = (provider: string) => {
  if (provider.startsWith('pateh')) return '/logo/providers/pateh.png';
  if (provider.startsWith('mrbilit')) return '/logo/providers/mrbilit.png';
  if (provider.startsWith('flytoday')) return '/logo/providers/flytoday.png';
  if (provider.startsWith('alibaba')) return '/logo/providers/alibaba.png';
  if (provider.startsWith('safarmarket'))
    return '/logo/providers/safarmarket.jpeg';
  if (provider.startsWith('safar366'))
    return '/logo/providers/safar366.svg';
  return '';
};

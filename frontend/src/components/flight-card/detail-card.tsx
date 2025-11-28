import { ConvertRialToToman } from '@/helper/rilaToToman';
import { FlightData } from '@/types/flight-response';
import Image from 'next/image';
import { getProviderLogo, providerNameList } from '../flight-search/constants';

const DetailCard = ({ flight }: { flight: FlightData }) => {
  const { adult_price, provider_name, capacity } = flight;

  const isSubmitDisabled = true;
  const getProviderName = (name: string) => {
    let providerName = name;

    providerNameList.find((item) => {
      if (name.startsWith(item.value)) {
        providerName = providerName.replace(item.value, item.label);
      }
    });

    return providerName;
  };
  const providerLogo = getProviderLogo(provider_name);

  return (
    <div>
      <div className="border rounded-xl shadow-sm bg-card px-4 py-3 max-w-2xl w-full border-border hover:shadow-md transition-all">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col gap-2 items-center">
            {!!providerLogo ? (
              <Image
                width={40}
                height={40}
                className="rounded-full bg-white p-1 border border-border"
                alt={getProviderName(provider_name)}
                src={providerLogo}
              />
            ) : (
              <div className="size-10 rounded-full bg-muted border border-border"></div>
            )}
            <p className="text-xs text-muted-foreground">{getProviderName(provider_name)}</p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <p className="flex items-center gap-1">
              <span className="text-lg text-primary font-bold">
                {adult_price ? ConvertRialToToman(adult_price) : '0'}
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                تومان
              </span>
            </p>

            <button
              disabled={isSubmitDisabled}
              className={`text-sm font-medium rounded-lg flex items-center justify-center h-9 px-6 text-primary-foreground transition-colors ${
                isSubmitDisabled 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {capacity ? 'انتخاب' : 'ناموجود'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailCard;

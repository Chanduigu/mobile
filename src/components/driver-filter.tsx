'use client';

export default function DriverFilter({
    drivers,
    currentDriverId,
    currentRange,
    currentFrom,
    currentTo
}: {
    drivers: { id: string, name: string }[];
    currentDriverId?: string;
    currentRange?: string;
    currentFrom?: string;
    currentTo?: string;
}) {
    return (
        <form className="w-full flex-1">
            <input type="hidden" name="range" value={currentRange || 'today'} />
            {currentFrom && <input type="hidden" name="from" value={currentFrom} />}
            {currentTo && <input type="hidden" name="to" value={currentTo} />}
            <select
                name="driverId"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                defaultValue={currentDriverId || ''}
                onChange={(e) => {
                    e.target.form?.submit();
                }}
            >
                <option value="">All Drivers</option>
                {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
        </form>
    );
}

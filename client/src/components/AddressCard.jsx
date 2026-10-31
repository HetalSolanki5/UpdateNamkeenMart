import React from 'react';

const AddressCard = ({
  address,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault
}) => {
  return (
    <div
      onClick={onSelect ? () => onSelect(address._id) : undefined}
      className={`p-4 rounded-xl border transition relative ${
        onSelect ? 'cursor-pointer' : ''
      } ${
        selected
          ? 'border-[#C62828] bg-[#FFF9F9] shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          {onSelect && (
            <input
              type="radio"
              checked={selected}
              onChange={() => onSelect(address._id)}
              className="text-[#C62828] focus:ring-[#C62828] cursor-pointer mt-0.5"
            />
          )}
          <span className="font-bold text-gray-900 text-sm">
            {address.receiverName}
          </span>
          {address.isDefault && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FDECEC] text-[#C62828] rounded-full">
              DEFAULT
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(address);
              }}
              className="text-gray-500 hover:text-[#C62828] font-medium transition cursor-pointer"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(address._id);
              }}
              className="text-gray-400 hover:text-red-600 font-medium transition cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Address Details */}
      <div className="mt-2.5 text-xs text-gray-600 space-y-1 pl-0 sm:pl-6">
        <p className="font-medium text-gray-700">Phone: {address.phoneNumber}</p>
        <p>
          {address.houseBuilding}, {address.subAddressArea}
          {address.landmark ? `, Landmark: ${address.landmark}` : ''}
        </p>
        <p>
          {address.city}, {address.state} - <span className="font-semibold text-gray-800">{address.pincode}</span>
        </p>
      </div>

      {/* Set as Default button if not already default */}
      {!address.isDefault && onSetDefault && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetDefault(address._id);
            }}
            className="text-[11px] font-semibold text-[#C62828] hover:text-[#8E1B1B] transition underline cursor-pointer"
          >
            Set as Default
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressCard;

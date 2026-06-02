{
  title: "Pulpo WMS",

  connection: {
    fields: [
      {
        name: 'username',
        optional: false,
      },
      {
        name: 'password',
        control_type: 'password',
        optional: false,
      },
      {
        name: 'environment',
        control_type: "select", 
        pick_list: [ ["Test", "eu-show" ], ["Live", "eu"] ],
        optional: false,
      },
    ],

    authorization: {
      type: 'custom_auth', #Set to custom_auth

      acquire: lambda do |connection|
        response = post("auth"). 
        payload(
          username: "#{connection['username']}",
          password: "#{connection['password']}",
          scope: "default",
          grant_type: "password")
        {
          access_token: response["access_token"],
        }
      end,

      refresh_on: 401,

      apply: lambda do |connection|
        headers("Authorization": "Bearer #{connection['access_token']}")
      end
    },

    base_uri: lambda do |connection|
      "https://#{connection['environment']}.pulpo.co/api/v1/"
    end,

  },

  test: lambda do |connection|
    get("iam/users/me")
  end,

  object_definitions: {
    address: {
      fields: lambda do |_connection, _config_fields, _object_definitions|
        [
          { name: "street" },
          { name: "house_nr" },
          { name: "zip" },
          { name: "city" },
          { name: "state" },
          { name: "country" },
          { name: "country_alpha2" },
          { name: "country_code" },
          { name: "email" },
          { name: "additional_info" }
        ]
      end
    },
    third_party: {
      fields: lambda do |_connection, _config_fields, _object_definitions|
        [
          { name: "active", type: "boolean" },
          { name: "attributes", type: "object", properties: 
            [
              { name: "addresses", type: "array", of: "object", properties: 
                [
                  { name: "address", type: "object", properties: _object_definitions['address'] },
                  { name: "company_name" },
                  { name: "name" },
                  { name: "phone_number" }
                ]
              }
            ]
          },
          { name: "deleted_at", type: "date_time", parse_output: "date_time_conversion" },
          { name: "deleted_by" },
          { name: "email" },
          { name: "erp_code" },
          { name: "erp_id" },
          { name: "id", type: "integer", parse_output: "integer_conversion" },
          { name: "identifier_number" },
          { name: "identifier_type" },
          { name: "merchant_channel_id", type: "integer", parse_output: "integer_conversion" },
          { name: "merchant_id", type: "integer", parse_output: "integer_conversion" },
          { name: "name" },
          { name: "tenant_id", type: "integer", parse_output: "integer_conversion" },
          { name: "third_type" }
        ]
      end
    },
    product: {
      fields: lambda do |_connection, _config_fields|
        pa = _config_fields['product_attributes'].present? ? _config_fields['product_attributes'] : "[]"
        [
          { name: "sku" },
          { name: "name" },
          { name: "article_number" },
          { name: "description" },
          { name: "id", type: "integer", parse_output: "integer_conversion" },
          { 
            name: "attributes", type: "object",  
            properties: parse_json(pa) 
          },
          { name: "barcodes", type: "array", of: "string" },
          { name: "product_categories", type: "array", of: "object", properties: 
            [
              { name: "name" },
              { name: "code" },
              { name: "id", type: "integer", parse_output: "integer_conversion" }
            ]
          },
          { name: "height", type: "number", parse_output: "float_conversion" },
          { name: "length", type: "number", parse_output: "float_conversion" },
          { name: "volume", type: "number", parse_output: "float_conversion" },
          { name: "weight", type: "number", parse_output: "float_conversion" },
          { name: "width", type: "number", parse_output: "float_conversion" },
          { name: "origin_country" },
          { name: "sales_measure_units" },
          { name: "management_type" },
          { name: "third_party_id", type: "integer", parse_output: "integer_conversion" },
          { name: "supplier_product_id" },
          { name: "third_party", type: "object", properties: [] },
          { name: "merchant_channel_ids", type: "array", of: "number" },
          { name: "cost_price", type: "number", parse_output: "float_conversion" },
          { name: "hs_code" },
          { name: "merchant_id", type: "integer", parse_output: "integer_conversion" },
          { name: "tenant_id", type: "integer", parse_output: "integer_conversion" },
          { name: "units_per_pallet", type: "integer", parse_output: "integer_conversion" },
          { name: "units_per_purchase_package", type: "integer", parse_output: "integer_conversion" },
          { name: "units_per_sales_package", type: "integer", parse_output: "integer_conversion" }
        ]
      end
    },
    purchase_order: {
      fields: lambda do |_connection, _config_fields, _object_definitions|
        oa = _config_fields['purchase_order_attributes'].present? ? _config_fields['purchase_order_attributes'] : "[]"
        [
          { name: "state" },
          { name: "items", type: "array", of: "object", properties: 
            [
              { name: "product", type: "object", properties: _object_definitions['product'] },
              { name: "reason_codes", type: "object", properties: 
                [
                  { name: "reason_codes", type: "array" }
                ]
              },
              { name: "checked_quantity", type: "number", parse_output: "float_conversion" },
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "line_item_number" },
              { name: "line_order_id" },
              { name: "product_id", type: "integer", parse_output: "integer_conversion" },
              { name: "requested_quantity", type: "number", parse_output: "float_conversion" },
              { name: "state" }
            ]
          },
          { 
            name: "attributes", type: "object",  
            properties: parse_json(oa) 
          },
          { name: "third_party", type: "object", properties: [] },
          { name: "sales_order" },
          { name: "criterium" },
          { name: "delivery_date", type: "date_time", parse_output: "date_time_conversion" },
          { name: "id", type: "integer", parse_output: "integer_conversion" },
          { name: "merchant_channel_id", type: "integer", parse_output: "integer_conversion" },
          { name: "merchant_id", type: "integer", parse_output: "integer_conversion" },
          { name: "notes" },
          { name: "number_finished_early_events", type: "integer", parse_output: "integer_conversion" },
          { name: "order_num" },
          { name: "type" },
          { name: "updated_at", type: "date_time", parse_output: "date_time_conversion" },
          { name: "warehouse_id", type: "integer", parse_output: "integer_conversion" }
        ]
      end
    },
    incoming_good: {
      fields: lambda do |_connection, _config_fields, _object_definitions|
        [
          { name: "id", type: "integer", parse_output: "integer_conversion" },
          { name: "document_type" },
          { name: "sales_order_id", type: "integer", parse_output: "integer_conversion" },
          { name: "sequence_number" },
          { name: "warehouse_id", type: "integer", parse_output: "integer_conversion" },
          { name: "items", type: "array", of: "object", properties: 
            [
              { name: "product", type: "object", properties: _object_definitions['product'] },
              { name: "batch", type: "object", properties: 
                [
                  { name: "product", type: "object" },
                  { name: "third_party", type: "object" },
                  { name: "client_id", type: "integer", parse_output: "integer_conversion" },
                  { name: "expiration_date", type: "date_time", parse_output: "date_time_conversion" },
                  { name: "id", type: "integer", parse_output: "integer_conversion" },
                  { name: "number" },
                  { name: "product_id", type: "integer", parse_output: "integer_conversion" },
                  { name: "third_party_id", type: "integer", parse_output: "integer_conversion" },
                  { name: "lot" },
                ] 
              },
              { name: "packing_boxes", type: "array" },
              { name: "reason_codes", type: "array" },
              { name: "destination_location_id", type: "integer", parse_output: "integer_conversion" },
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "line_item_number" },
              { name: "line_order_id" },
              { name: "notes" },
              { name: "quantity", type: "number", parse_output: "float_conversion" },
              { name: "state" }
            ]
          },
          {
            name: "owner", type: "object", properties: 
            [
              { name: "username" },
              { name: "email" },
              { name: "employee_id" },
              { name: "first_name" },
              { name: "last_name" },
              { name: "type" },
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "active", type: "boolean" },
              { name: "is_billable", type: "boolean" },
              { name: "language" },
              { name: "tenant_id", type: "integer", parse_output: "integer_conversion" },
              { name: "updated_at", type: "date_time", parse_output: "date_time_conversion" },
            ],
          },
          { name: "purchase_order", type: "object", properties: _object_definitions['purchase_order'] },
          { name: "third_party", type: "object", properties: _object_definitions['third_party'] },
          { name: "criterium" },
          { name: "end_date", type: "date_time", parse_output: "date_time_conversion" },
          { name: "start_date", type: "date_time", parse_output: "date_time_conversion" },
          { name: "inserted_at", type: "date_time", parse_output: "date_time_conversion" },

          { name: "merchant_channel_id", type: "integer", parse_output: "integer_conversion" },
          { name: "merchant_id", type: "integer", parse_output: "integer_conversion" }
        ]
      end
    },
    sales_order: {
      fields: lambda do |_connection, _config_fields, _object_definitions|
        item_attr = _config_fields['sales_order_item_attributes'].present? ? _config_fields['sales_order_item_attributes'] : "[]"
        so_attr = _config_fields['sales_order_attributes'].present? ? _config_fields['sales_order_attributes'] : "[]"
        [
          { name: "id", type: "integer", parse_output: "integer_conversion" },
          { name: "order_num" },
          { name: "type" },
          { 
            name: "attributes", type: "object",  
            properties: parse_json(so_attr) 
          },
          { name: "third_party", type: "object", properties: _object_definitions['third_party'] },
          { name: "third_party_id", type: "integer", parse_output: "integer_conversion" },
          { name: "shipping_method_id", type: "integer", parse_output: "integer_conversion" },
          { name: "items", type: "array", of: "object", properties: 
            [
              { name: "product", type: "object", properties: _object_definitions['product'] },
              { 
                name: "attributes", type: "object",  
                properties: parse_json(item_attr) 
              },
              { name: "fulfilled_quantity", type: "number", parse_output: "float_conversion" },
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "line_order_id" },
              { name: "notes" },
              { name: "product_id", type: "integer", parse_output: "integer_conversion" },
              { name: "quantity", type: "number", parse_output: "float_conversion" },
              { name: "required_date", type: "date_time", parse_output: "date_time_conversion" },
              { name: "state" }
            ]
          },
          { name: "is_cart", type: "boolean" },
          { name: "purchase_order_id", type: "integer", parse_output: "integer_conversion" },
          { name: "channel" },
          { name: "destination_warehouse" },
          { name: "attachments", type: "array", of: "object", properties: 
            [
              { name: "document_type" },
              { name: "extension" },
              { name: "file_type" },
              { name: "id" },
              { name: "name" },
              { name: "type" },
              { name: "url" }
            ]
          },
          { name: "warehouse_id", type: "integer", parse_output: "integer_conversion" },
          { name: "inserted_at", type: "date_time", parse_output: "date_time_conversion" },
          { name: "updated_at", type: "date_time", parse_output: "date_time_conversion" },
          { name: "priority", type: "integer", parse_output: "integer_conversion" },
          { name: "merchant_channel_id", type: "integer", parse_output: "integer_conversion" },
          { name: "custom_filter_strategy" },
          
          { name: "estimated_total_volume", type: "number", parse_output: "float_conversion" },
          { name: "shipment_instructions", type: "object", properties: 
            [
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "shipment_terms_code" },
              { name: "shipment_terms_location" },
              { name: "shipping_method_id", type: "integer", parse_output: "integer_conversion" },
              { name: "trip_number" }
            ]
          },
          { name: "creator_id", type: "integer", parse_output: "integer_conversion" },
          { name: "creator", type: "object", properties: 
            [
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "first_name" },
              { name: "last_name" },
              { name: "username" }
            ]
          },
          { name: "destination_warehouse_id", type: "integer", parse_output: "integer_conversion" },
          { name: "delivery_date", type: "date_time", parse_output: "date_time_conversion" },
          { name: "ship_to", type: "object", properties: 
            [
              { name: "company_name" },
              { name: "name" },
              { name: "phone_number" },
              { name: "address", type: "object", properties: _object_definitions['address'] }
            ]
          },
          { name: "criterium" },
          { name: "notes" },
          { name: "merchant_id", type: "integer", parse_output: "integer_conversion" },
          { name: "estimated_total_weight", type: "number", parse_output: "float_conversion" },
          { name: "warehouse", type: "object", properties: 
            [
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "company_name" },
              { name: "name" },
              { name: "active", type: "boolean" },
              { name: "zip_code" },
              { name: "city" },
              { name: "state" },
              { name: "country_code" },
              { name: "email" },
              { name: "fax" },
              { name: "line1" },
              { name: "line2" },
              { name: "phone" },
              { name: "priority", type: "integer", parse_output: "integer_conversion" },
              { name: "site" },
              { name: "tenant_id", type: "integer", parse_output: "integer_conversion" }
            ]
          },
          { name: "service_point_id" },
          { name: "fulfillment_orders", type: "array", of: "number" },
          { name: "missing_stock_items_cancelled", type: "boolean" },
          { name: "custom_filter_strategy_id" },
          { name: "process_information" },
          { name: "shipping_method", type: "object", properties: 
            [
              { name: "id", type: "integer", parse_output: "integer_conversion" },
              { name: "carrier" },
              { name: "name" },
              { name: "service" },
              { name: "fetch_label", type: "boolean" },
              { name: "merchant_channel_id", type: "integer", parse_output: "integer_conversion" },
              { name: "merchant_id", type: "integer", parse_output: "integer_conversion" },
              { name: "tenant_id", type: "integer", parse_output: "integer_conversion" },
              { name: "updated_at", type: "date_time", parse_output: "date_time_conversion" }
            ]
          },
          { name: "process_information_id", type: "integer", parse_output: "integer_conversion" },
          { name: "state" },
          { name: "packing_location_id", type: "integer", parse_output: "integer_conversion" }
        ] 
      end
    }
  },

  custom_action: true,

  custom_action_help: {
    learn_more_url: "https://eu.pulpo.co/api/v1/swagger/index.html",
    learn_more_text: "Pulpo WMS API documentation",
    body: "<p>Build your own API action with a HTTP request. The request will be authorized with your Pulpo WMS API connection.</p>"
  },

  actions: {
    # Add the action code from CoPilot in this hash before testing in Test code!
  },

  triggers: {
    goods_receipt: {
      title: "Goods receipt",
      subtitle: "Triggers when items and quantities are accepted or rejected through one or multiple incoming goods",
      description: lambda do |input, picklist_label|
        "<span class='provider'>Goods receipt</span> in " \
          "<span class='provider'>Pulpo</span>"
      end,

      input_fields: lambda do |object_definitions|
        [
          {
            name: 'since',
            label: 'When first started, this recipe should pick up events from',
            type: 'timestamp',
            optional: true,
            sticky: true,
            hint: 'When you start recipe for the first time, it picks up ' \
              'trigger events from this specified date and time. Defaults to ' \
              'the current time.'
          },
          {
            name: "warehouse", control_type: "select", pick_list: "warehouses", optional: false
          }, 
          { 
            name: "product_attributes", control_type: "schema-designer", sticky: true,
            extends_schema: true, add_field_label: "Add product attribute", 
            hint: "If you have declared custom properties for your products, please add them here to make them part of the output schema."
          },
          { 
            name: "purchase_order_attributes", control_type: "schema-designer", sticky: true,
            extends_schema: true, add_field_label: "Add purchase order property", 
            hint: "If you have declared custom properties for your purchase order, please add them here to make them part of the output schema."
          }
        ]
      end,

      poll: lambda do |connection, input, closure, _eis, _eos|
        closure = {} unless closure.present?
        page_size = 100

        updated_since = (closure['cursor'] || input['since'] || Time.now ).to_time.utc.iso8601

        response = get("reception/incoming_goods").
          params(limit: page_size, inserted_at: "gte:#{updated_since}", 
            warehouse_id: input['warehouse'], sort_by: "inserted_at:asc")

        closure['cursor'] = response['incoming_goods'].last&.dig('inserted_at') unless response.blank?

        {
          events: response['incoming_goods'],
          next_poll: closure,
          can_poll_more: response['total_results'] >= page_size
        }
      end,

      webhook_subscribe: lambda do |webhook_url, connection, input, recipe_id|
        response = post("webhook",
          url: webhook_url,
          allowed_types: [ "incoming_good_created" ],
          enabled: true,
          method: "GET", 
          warehouse_id: input['warehouse']).
          after_error_response(/.*/) do |code, body, header, message|
            error("#{message}: #{body}")
          end
        response['webhooks'].first
      end,

      webhook_unsubscribe: lambda do |webhook_subscribe_output, connection|
        delete("webhook/#{webhook_subscribe_output['id']}")
      end,

      dedup: lambda do |event|
        "#{event['id']}|#{event['inserted_at']}|#{event['sequence_number']}"
      end,

      output_fields: lambda do |object_definitions, connection, config_fields|
        object_definitions['incoming_good']
      end,
      
      sample_output: lambda do |input|
        get("reception/incoming_goods").params(limit: 1).dig("incoming_goods").first
      end
    },
    new_updated_salesorder: {
      title: "New/Updated Salesorder",
      subtitle: "Triggers when a salesorder is created or updated",
      description: lambda do |input, picklist_label|
        "New/Updated <span class='provider'>sales order</span> in " \
          "<span class='provider'>Pulpo</span>"
      end,

      input_fields: lambda do |object_definitions|
        [
          {
            name: 'since',
            label: 'When first started, this recipe should pick up events from',
            type: 'timestamp',
            optional: true,
            sticky: true,
            hint: 'When you start recipe for the first time, it picks up ' \
              'trigger events from this specified date and time. Defaults to ' \
              'the current time.'
          },
          {
            name: "warehouse", control_type: "select", pick_list: "warehouses", optional: false
          },
          { 
            name: "sales_order_attributes", control_type: "schema-designer", sticky: true,
            extends_schema: true, add_field_label: "Add sales order attribute", 
            hint: "If you have declared custom properties for your Salesorder, please add them here to make them part of the output schema."
          },
          { 
            name: "sales_order_item_attributes", control_type: "schema-designer", sticky: true,
            extends_schema: true, add_field_label: "Add sales order item attribute", 
            hint: "If you have declared custom properties for your Salesorder items, please add them here to make them part of the output schema."
          }
        ]
      end,

      poll: lambda do |connection, input, closure, _eis, _eos|
        closure = {} unless closure.present?
        page_size = 100

        updated_since = (closure['cursor'] || input['since'] || Time.now ).to_time.utc.iso8601

        response = get("sales/orders").
          params(limit: page_size, updated_at: "gte:#{updated_since}", 
            warehouse_id: input['warehouse'], sort_by: "updated_at:asc")

        closure['cursor'] = response['sales_orders'].last&.dig('updated_at') unless response.blank?
        {
          events: response['sales_orders'],
          next_poll: closure,
          can_poll_more: response['total_results'] >= page_size
        }
      end,

            webhook_subscribe: lambda do |webhook_url, connection, input, recipe_id|
              response = post("webhook",
                url: webhook_url,
                allowed_types: [ "sales_order_created", "sales_order_updated" ],
                enabled: true,
                method: "GET", 
                warehouse_id: input['warehouse']).
                after_error_response(/.*/) do |code, body, header, message|
                  error("#{message}: #{body}")
                end
              response['webhooks'].first
            end,
      
            webhook_unsubscribe: lambda do |webhook_subscribe_output, connection|
              delete("webhook/#{webhook_subscribe_output['id']}")
            end,

      dedup: lambda do |event|
        "#{event['id']}|#{event['updated_at']}"
      end,

      output_fields: lambda do |object_definitions, connection, config_fields|
        object_definitions['sales_order']
      end,
      
      sample_output: lambda do |input|
        get("sales/orders").params(limit: 1).dig("sales_orders").first
      end
    }
  },

  pick_lists: {
    warehouses: lambda do
      get("warehouses").
        dig("warehouses").map do |wh|
          [ wh["name"], wh["id"] ]
        end
    end,
  }
}

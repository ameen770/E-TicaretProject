$(document).ready(function () {

    fetchDataAndProcessTable();
});

$(document).click(function (event) {
    var target = $(event.target);
    var dropdownMenu = $('.dropdown-menu');

    // T�klanan element dropdown men� veya dropdown butonu de�ilse men�y� kapat
    if (!target.hasClass('dropdown-menu') && !target.hasClass('dropdown-toggle')) {
        dropdownMenu.hide();
    }
});

function fetchDataAndProcessTable() {

    var tableGlobalFilter = {
        First: 1,
        Rows: 5,
        SortField: null,
        SortOrder: null,
        Filters: [],
    };

    var filters = [];
    $('.filter').each(function () {
        var inputValue = $(this).find('input').val();

        if (inputValue) {
            var propertyField = $(this).find('input').attr('field');
            var operator = $(this).find('input').attr('operator');

            if (propertyField) {
                var filter = {
                    Field: propertyField,
                    Operator: operator ? operator : "contains",
                    SearchValue: inputValue
                };

                filters.push(filter); // Filtreyi ge�ici diziye ekleyin
            }
        }
    });
    tableGlobalFilter.Filters = filters; // Ge�ici diziyi tableGlobalFilter.Filters'a atay�n

    if ($("thead > tr > th.sorting_asc").length) {
        tableGlobalFilter.SortField = $("thead > tr > th.sorting_asc").attr("field");
        tableGlobalFilter.SortOrder = $("thead > tr > th.sorting_asc").attr("order");
    }
    else if ($("thead > tr > th.sorting_desc").length) {
        tableGlobalFilter.SortField = $("thead > tr > th.sorting_desc").attr("field");
        tableGlobalFilter.SortOrder = $("thead > tr > th.sorting_desc").attr("order");
    }

    var table = $('.table');
    var readUrl = table.attr('read-url');
    var page = table.attr('page');
    var pageSize = table.attr('page-size');

    if (page) {
        tableGlobalFilter.First = parseInt(page);
    }
    if (pageSize) {
        tableGlobalFilter.Rows = parseInt(pageSize);
    }
    var data = {
        First: tableGlobalFilter.First,
        Rows: tableGlobalFilter.Rows,
        SortField: tableGlobalFilter.SortField,
        SortOrder: tableGlobalFilter.SortOrder,
    };

    tableGlobalFilter.Filters.forEach((filter, i) => {
        data[`Filters[${i}].Field`] = filter.Field;
        data[`Filters[${i}].Operator`] = filter.Operator;
        data[`Filters[${i}].SearchValue`] = filter.SearchValue;
    });

    $.ajax({
        type: 'GET',
        url: readUrl,
        data: data,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function (data) {
            if (data.data.statusCode === 401) {
                //alert("Yetkilendirme hatas�: Eri�im izniniz yok.");
                app.showErrorDialog("Hata", "Yetkilendirme hatas�: Oturumunuzun s�resi doldu veya eri�im izniniz yok.", "/Home/Index");

                // window.location.href = "/Home/Index"; // �rnek bir giri� sayfas�na y�nlendirme
                return;
            }
            processTableData(data);
        }, error: function (xhr, textStatus, errorThrown) {
            debugger;
            //todo  Buray� en son ayarla


            // Di�er hata durumlar�n� burada i�leyebilirsiniz
        }
    });
}

var addButton = null;

function processTableData(data) {
    var tableData = data.data;
    var first = data.currentPage;
    var recordsPerPage = data.pageSize == null ? 5 : data.pageSize; // Sayfa ba��na kay�t say�s�
    var total = data.total;
    var totalPage = data.totalPage;
    var createUrl = $('.table').attr('create-url');

    if (createUrl && !addButton) {
        addButton = $("<button>").addClass("btn btn-sm btn-warning").html('<i class="fas fa-plus-circle mr-1"></i> Yeni Kay�t').css("margin", "10px");;
        addButton.click(function () {
            window.location.href = createUrl;
        });

        $("table").before(addButton);
    }


    if (tableData.length === 0) {
        $('th').remove();
        var spanElement = $('<span>', {
            class: 'badge badge-warning',
            style: 'font-size:100%',
            html: 'Kay�t bulunamad�'
        });

        $('tbody').empty().append($('<tr>').append($('<td>').attr('colspan', Object.keys(tableData[0]).length).append(spanElement)));
        return;
    }

    $('tbody').empty();


    $.each(tableData, function (index, value) {
        var tr = $('<tr>');
        $.each(value, function (key, val) {

            if (key !== "id") {
                var formattedValue = val;
                if (key === "createdDate") {
                    formattedValue = formatDate(val);
                }
                if (key === "unitPrice") {
                    formattedValue = formatCurrency(val);
                }
                var td = $('<td>').text(formattedValue);
                tr.append(td);
            }
        });

        var table = $('.table');
        var editUrl = table.attr('edit-url');
        var deleteUrl = table.attr('delete-url');

        var id = value.id;
        var customProperty = $("th").attr("custom-property");

        debugger;
        if (customProperty == "1") {
            var dropdownButton = $('<button>').addClass('btn btn-link dropdown-toggle').attr('type', 'button').attr('data-toggle', 'dropdown').append(
                $('<i>').addClass('fas fa-bars')
            );

            var dropdownMenu = $('<div>').addClass('dropdown-menu');

            if (editUrl && editUrl !== "") {
                dropdownMenu.append(
                    $('<a>').attr('href', '#').addClass('dropdown-item grid-edit')
                        .append($('<i>').addClass('fas fa-pencil-alt'), ' Duzenle'),
                                        $('<div>').addClass('dropdown-divider')

                );

            }
            if (deleteUrl && deleteUrl !== "") {
                dropdownMenu.append(
                    $('<a>').attr('href', '#').addClass('dropdown-item grid-delete text-danger').append(
                        $('<i>').addClass('fas fa-trash-alt'),
                        ' Sil'
                    )
                );
            }

            //if (editUrl && editUrl !== "" && customProperty == "1") {
            //    debugger;
            //    var dropdownButton = $('<button>').addClass('btn btn-link dropdown-toggle').attr('type', 'button').attr('data-toggle', 'dropdown').append(
            //        $('<i>').addClass('fas fa-bars')
            //    );

            //    var dropdownMenu = $('<div>').addClass('dropdown-menu').append(
            //        $('<a>').attr('href', '#').addClass('dropdown-item grid-edit').append(
            //            $('<i>').addClass('fas fa-pencil-alt'),
            //            ' Duzenle'
            //        )
            //    );

            //    if (deleteUrl && deleteUrl !== "") {
            //        dropdownMenu.append(
            //            $('<div>').addClass('dropdown-divider'),
            //            $('<a>').attr('href', '#').addClass('dropdown-item grid-delete text-danger').append(
            //                $('<i>').addClass('fas fa-trash-alt'),
            //                ' Sil'
            //            )
            //        );
            //    }


            dropdownButton.click(function () {
                dropdownMenu.toggle(); // Men�y� a�mak/kapatmak i�in toggle() y�ntemini kullan�yoruz
            });


            dropdownMenu.find('.grid-edit').click(function () {
                window.location.href = `${editUrl}?id=${id}`; // D�zenleme sayfas�na y�nlendir
            });

            dropdownMenu.find('.grid-delete').click(function () {
                app.confirmModal("Kay�t Silme", "Bu kayd� silmeyi onayl�yor musunuz?", function () {
                    app.callJx(`${deleteUrl}`, "body", { id: id }, function () {
                        fetchDataAndProcessTable();
                    });
                });
            });

            var dropdownColumn = $('<td>').append(dropdownButton, dropdownMenu);
            tr.prepend(dropdownColumn);

        }
        $('tbody').append(tr);

    });

    // Toplam kay�t say�s�n� i�eren div'i olu�tur
    var totalDiv = $('<div>').addClass('total-records').html('Toplam Kay�t: ' + total);

    // Kay�t say�s� se�enek kutusunu i�eren div'i olu�tur
    var selectDiv = $('<div>').addClass('select-records');
    var selectElement = $('<select>').addClass('form-control');
    selectElement.append($('<option>').val(5).text('5'));
    selectElement.append($('<option>').val(10).text('10'));
    selectElement.append($('<option>').val(15).text('15'));
    selectElement.append($('<option>').val(20).text('20'));

    // Se�enek kutusunun de�erini g�ncelleme i�lemi
    selectElement.val(recordsPerPage);

    selectElement.on('change', function () {
        recordsPerPage = parseInt($(this).val());
        var table = $('grid table');
        table.attr("page", "1");
        table.attr("page-size", recordsPerPage);

        changePage();
    });

    selectDiv.append(selectElement);

    // Sayfalama d��melerini olu�tur
    var paginationContainer = $('<div>').addClass('pagination-container');
    var paginationDiv = $('<div>').addClass('pagination pagination-rounded flex-grow-1 mt-2');

    var prevButton = $('<button>').addClass('pagination-button').html('�nceki');
    if (first > 1) {
        prevButton.click(function () {
            var table = $('grid table');
            var result = first - 1;
            table.attr("page", result.toString());
            changePage();
        });

    } else {
        prevButton.attr('disabled', 'disabled');
    }

    paginationDiv.append(prevButton);

    for (var i = 1; i <= totalPage; i++) {
        var pageButton = $('<button>').addClass('pagination-button').text(i);
        if (first === i) {
            pageButton.addClass('active');
        } else {
            pageButton.click((function (page) {
                return function () {
                    var table = $('grid table');
                    table.attr("page", page);
                    changePage();
                };
            })(i));
        }
        paginationDiv.append(pageButton);
    }

    var nextButton = $('<button>').addClass('pagination-button').html('Sonraki');
    if (first < totalPage) {
        nextButton.click(function () {
            var table = $('grid table');
            var result = first + 1;
            table.attr("page", result.toString());
            changePage();
        });
    } else {
        nextButton.attr('disabled', 'disabled');
    }

    paginationDiv.append(nextButton);
    paginationContainer.append(paginationDiv, totalDiv, selectDiv);

    // Sayfalama d��melerini tabloya ekle
    $('.pagination-container').remove(); // Eski sayfalama d��melerini temizle
    $('table').after(paginationContainer);

    function changePage() {
        fetchDataAndProcessTable(); // Tabloyu g�ncelle
    }

    $('th[order="1"]').each(function () {
        var $th = $(this);
        var sortOrder = $th.attr('order');

        if ($th.find('i').length === 0) {
            var icon = $('<i>').addClass('fa fa-sort ml-1');
            $th.append(icon);
        }

        $th.click(function () {
            sortOrder = sortOrder === '0' ? '1' : '0';
            $th.attr('order', sortOrder);

            $th.find('i').removeClass('fa-sort-asc fa-sort-desc').addClass('fa-sort');

            if (sortOrder === '0') {
                $th.addClass('sorting_asc').removeClass('sorting_desc');
                $th.find('i').removeClass('fa-sort-desc').addClass('fa-sort-asc');
            } else {
                $th.addClass('sorting_desc').removeClass('sorting_asc');
                $th.find('i').removeClass('fa-sort-asc').addClass('fa-sort-desc');
            }

            $th.siblings('th').removeClass('sorting_asc sorting_desc');
            $th.siblings('th').find('i').removeClass('fa-sort-asc fa-sort-desc');

            changePage();

        });

    });
}

$(document).on('click', '#searchButton', function () {
    fetchDataAndProcessTable();
});

function formatCurrency(data) {
    // Para birimi bi�imlendirme i�lemi i�in "toLocaleString" y�ntemini kullanabiliriz.
    // Bu y�ntem sayesinde, taray�c�n�n dil ve b�lge ayarlar�na uygun para birimi format� elde edilir.
    // �rnek: 12345.67 -> 12,345.67
    return parseFloat(data).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(data) {
    var date = new Date(data);
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var hour = date.getHours();
    var minute = date.getMinutes();

    // Saniye de�erini almad�k, b�ylece saniye g�sterilmeyecek

    // S�f�rlar� ekleme
    day = day < 10 ? "0" + day : day;
    month = month < 10 ? "0" + month : month;
    hour = hour < 10 ? "0" + hour : hour;
    minute = minute < 10 ? "0" + minute : minute;

    var formattedDate = day + "." + month + "." + year + " " + hour + ":" + minute;
    return formattedDate;
}


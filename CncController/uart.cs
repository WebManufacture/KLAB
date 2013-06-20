using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Text;
using System.IO.Ports;
using System.Threading;
using FTD2XX_NET;
using System.Threading.Tasks;

public delegate void OnReceiveHandler(byte[] data);

public class Startup
{
    Uart device;
    
    public Task<object> Invoke(IDictionary<string, object> input)
    {
        if (input.ContainsKey("action"))
        {
            var action = input["action"].ToString();
            if (action == "init")
            {
                return Init(input);
            }
            if (device != null)
            {
                if (action == "write")
                {
                    device.Send((byte[])input["data"]);
                    return null;
                }
                if (action == "command")
                {
                    var obj = new MotorCommand();
                    if (input.ContainsKey("command"))
                    {
                        obj.command = (byte)input["command"];
                    }
                    if (input.ContainsKey("speed"))
                    {
                        obj.Speed = (ushort)input["speed"];
                    }
                    if (input.ContainsKey("x"))
                    {
                        obj.X = (int)input["x"];
                    }
                    if (input.ContainsKey("y"))
                    {
                        obj.Y = (int)input["y"];
                    }
                    if (input.ContainsKey("z"))
                    {
                        obj.Z = (int)input["z"];
                    }
                    device.Send(obj);
                    return null;
                }
                if (action == "close")
                {
                    device.Close();
                    return null;
                }
                if (action == "read")
                {
                    return await Task.Run(() => { return device.Read(); });
                }
                if (action == "state")
                {
                    return await Task.Run(() => { return device.GetState(); });
                }
            }
        }
        else
        {
            throw new InvalidOperationException("Unsupported type of command.");
        }
        return null;
    }


    public bool Init(IDictionary<string, object> characters)
    {
        var devs = Uart.GetDevicesList();
        foreach (var ftDeviceInfoNode in devs)
        {
            if (ftDeviceInfoNode.Type == FTDI.FT_DEVICE.FT_DEVICE_232R)
            {
                uint speed = 38400;
                uint timeout = 1000;
                byte bytes = 8;
                byte stops = 1;
                if (characters.ContainsKey("speed"))
                {
                    speed = (uint)characters["speed"];
                }
                if (characters.ContainsKey("timeout"))
                {
                    timeout = (uint)characters["timeout"];
                }
                if (characters.ContainsKey("bytes"))
                {
                    bytes = (byte)characters["bytes"];
                }
                if (characters.ContainsKey("speed"))
                {
                    stops = (byte)characters["stops"];
                }
                device = new Uart(ftDeviceInfoNode.SerialNumber, speed, timeout, bytes, stops);
                return true;
            }
        }
        return false;
    }
}

public class MotorCommand
{
    public byte command;
    public uint? programLine;
    public int? X;
    public int? Y;
    public int? Z;
    public ushort? Speed;
}

public class MotorState
{
    public byte command;
    public int x;
    public int y;
    public int z;
    public int xLimit;
    public int yLimit;
    public int zLimit;
    public byte state;
    public DateTime date = DateTime.Now;
    public ushort line;
}

public enum ASCII : byte
{
    NUL = 0x00,// Null= пустой. Всегда игнорировался. На перфолентах 1 представлялась отверстием= 0,//отсутствием отверстия. Поэтому пустые части перфоленты до начала и после конца сообщения состояли из таких символов. Сейчас используется во многих языках программирования как конец строки. (Строка понимается как последовательность символов.) В некоторых операционных системах NUL,//последний символ любого текстового файла.
    SOH = 0x01,// Start Of Heading= начало заголовка.
    STX = 0x02,// Start of Text= начало текста. Текстом называлась часть сообщения= предназначенная для печати. Адрес= контрольная сумма и т. д. входили или в заголовок= или в часть сообщения после текста.
    ETX = 0x03,//End of Text= конец текста. Здесь телетайп прекращал печатать. Использование символа Ctrl-C= имеющего код 03= для прекращения работы чего-то (обычно программы)= восходит ещё к тем временам.
    EOT = 0x04,//End of Transmission= конец передачи. В системе UNIX Ctrl-D= имеющий тот же код= означает конец файла при вводе с клавиатуры.
    ENQ = 0x05,//Enquire. Прошу подтверждения.
    ACK = 0x06,//Acknowledgement. Подтверждаю.
    BEL = 0x07,//Bell= звонок= звуковой сигнал. Сейчас тоже используется. В языках программирования C и C++ обозначается \a.
    BS = 0x08,//Backspace= возврат на один символ. Сейчас стирает предыдущий символ.
    TAB = 0x09,//Tabulation. Обозначался также HT,//Horizontal Tabulation= горизонтальная табуляция. Во многих языках программирования обозначается \t .
    LF = 0x0A,//Line Feed= перевод строки. Сейчас в конце каждой строчки текстового файла ставится либо этот символ= либо CR= либо и тот и другой (CR= затем LF)= в зависимости от операционной системы. Во многих языках программирования обозначается \n и при выводе текста приводит к переводу строки.
    VT = 0x0B,//Vertical Tab= вертикальная табуляция.
    FF = 0x0C,//Form Feed= новая страница.
    CR = 0x0D,//Carriage Return= возврат каретки. Во многих языках программирования этот символ= обозначаемый \r= можно использовать для возврата в начало строчки без перевода строки. В некоторых операционных системах этот же символ= обозначаемый Ctrl-M= ставится в конце каждой строчки текстового файла перед LF.
    SO = 0x0E,//Shift Out= измени цвет ленты (использовался для двуцветных лент; цвет менялся обычно на красный). В дальнейшем обозначал начало использования национальной кодировки.
    SI = 0x0F,//Shift In= обратно к Shift Out.
    DLE = 0x10,//Data Link Escape= следующие символы имеют специальный смысл.
    DC1 = 0x11,//Device Control 1= 1-й символ управления устройством,//включить устройство чтения перфоленты.
    DC2 = 0x12,//Device Control 2= 2-й символ управления устройством,//включить перфоратор.
    DC3 = 0x13,//Device Control 3= 3-й символ управления устройством,//выключить устройство чтения перфоленты.
    DC4 = 0x14,//Device Control 4= 4-й символ управления устройством,//выключить перфоратор.
    NAK = 0x15,//Negative Acknowledgment= не подтверждаю. Обратно к Acknowledgment.
    SYN = 0x16,//Synchronization. Этот символ передавался= когда для синхронизации было необходимо что-нибудь передать.
    ETB = 0x17,//End of Text Block= конец текстового блока. Иногда текст по техническим причинам разбивался на блоки.
    CAN = 0x18,//Cancel= отмена (того= что было передано ранее).
    EM = 0x19,//End of Medium= кончилась перфолента и т. д.
    SUB = 0x1A,//Substitute= подставить. Ставится на месте символа= значение которого было потеряно или испорчено при передаче. Сейчас Ctrl-Z используется как конец файла при вводе с клавиатуры в системах DOS и Windows. У этой функции нет никакой очевидной связи с символом SUB.
    ESC = 0x1B,//Escape. Следующие символы,//что-то специальное.
    FS = 0x1C,//File Separator= разделитель файлов.
    GS = 0x1D,//Group Separator= разделитель групп.
    RS = 0x1E,//Record Separator= разделитель записей.
    US = 0x1F,//Unit Separator= разделитель юнитов. То есть поддерживалось 4 уровня структуризации данных: сообщение могло состоять из файлов= файлы из групп= группы из записей= записи из юнитов.
    DEL = 0x7F,//Delete= стереть последний символ. Символом DEL= состоящим в двоичном коде из всех единиц= можно было забить любой символ. Устройства и программы игнорировали DEL так же= как NUL. Код этого символа происходит из первых текстовых процессоров с памятью на перфоленте: в них удаление символа происходило забиванием его кода дырочками (обозначавшими логические единицы).
}

public enum EDeviceState
{
    Unknown,
    Present,
    Offline,
    Error,
    Busy,
    Online,
    Working
}

public enum UARTWritingState
{
    free,
    writing
}
public enum UARTReadingState
{
    free,
    reading,
    readingSized
}

public class Uart
{
    private EDeviceState _state = EDeviceState.Unknown;

    public string PortName;

    public List<string> Errors = new List<string>();

    private UARTWritingState writeState;

    private FTDI device = new FTDI();
    
    private void error(FTDI.FT_STATUS status, string error)
    {
        error = string.Format(error, status.ToString());
        Errors.Add(error);
        throw new Exception(error);
    }

    public static FTDI.FT_DEVICE_INFO_NODE[] GetDevicesList()
    {
        var device = new FTDI();
        uint devCount = 0;
        var status = device.GetNumberOfDevices(ref devCount);
        if (status != FTDI.FT_STATUS.FT_OK)
        {
            return null;
        }
        FTDI.FT_DEVICE_INFO_NODE[] devices = new FTDI.FT_DEVICE_INFO_NODE[devCount];
        status = device.GetDeviceList(devices);
        if (status == FTDI.FT_STATUS.FT_OK)
        {
            return devices;
        }
        return null;
    }

    public Uart(string serial, uint speed, uint timeout, byte bytes, byte stops)
    {
        if (device.IsOpen)
        {
            _state = EDeviceState.Busy;
            device.Close();
            _state = EDeviceState.Unknown;
        }
        var status = device.OpenBySerialNumber(serial);
        if (status == FTDI.FT_STATUS.FT_OK)
        {
            _state = EDeviceState.Present;
        }
        else
        {
            error(status, "Init device with SN: " + serial + " error {0}");
        }
        status = device.GetCOMPort(out PortName);
        if (status != FTDI.FT_STATUS.FT_OK || PortName == "")
        {
            error(status, "Init device with SN: " + serial + " No Port Specified {0}");
        }
        device.SetTimeouts(timeout, timeout);
        device.SetBaudRate(speed);
        device.SetDataCharacteristics(bytes, stops, FTDI.FT_PARITY.FT_PARITY_ODD);
        // port.DataReceived += new SerialDataReceivedEventHandler(port_DataReceived);
    }

    public MotorState Read()
    {
        if (device.IsOpen)
        {
            uint bytesRead = 0;
            var status = device.GetRxBytesAvailable(ref bytesRead);
            if (bytesRead > 0)
            {
                byte[] buf = new byte[bytesRead];
                status = device.Read(buf, bytesRead, ref bytesRead);
                if (buf[0] == 01)
                {
                    var size = buf[1];
                    var bytes = new byte[size / 2];
                    for (int i = 0; i < bytes.Length; i++)
                    {
                        bytes[i] = (byte)((buf[i * 2 + 2] & (byte)0x0F) * 16 + (buf[i * 2 + 3] & (byte)0x0F));
                    }
                    return ConvertData(bytes);
                }
            }
        }
        return null;
    }

    public EDeviceState GetState()
    {
        if (writeState > UARTWritingState.free)
        {
            _state = EDeviceState.Working;
            return _state;
        }
        try
        {
            if (device.IsOpen)
            {
                FTDI.FT_DEVICE dev = FTDI.FT_DEVICE.FT_DEVICE_UNKNOWN;
                if (device.GetDeviceType(ref dev) != FTDI.FT_STATUS.FT_OK)
                {
                    _state = EDeviceState.Unknown;
                    return _state;
                }
                if (dev == FTDI.FT_DEVICE.FT_DEVICE_UNKNOWN)
                {
                    _state = EDeviceState.Error;
                }
                else
                {
                    _state = EDeviceState.Online;
                }
            }
            else
            {
                _state = EDeviceState.Offline;
            }
        }
        catch (Exception e)
        {
            _state = EDeviceState.Error;
        }
        return _state;
    }

    public void Close()
    {
        if (device.IsOpen)
        {
            device.Close();
            _state = EDeviceState.Offline;
        }
    }

    public bool Send(byte[] buffer)
    {
        if (writeState > UARTWritingState.free) return false;
        if (buffer.Length > 255 || buffer.Length == 0) return false;
        if (!device.IsOpen)
        {
            return false;
        }
        writeState = UARTWritingState.writing;
        var buf = new byte[buffer.Length + 4];
        byte crc = 255;
        buf[0] = 0;
        buf[1] = (byte)buffer.Length;
        buffer.CopyTo(buf, 2);
        for (int i = 0; i < buffer.Length; i++)
        {
            crc ^= buffer[i];
        }
        buf[buf.Length - 2] = crc;
        buf[buf.Length - 1] = (byte)ASCII.EOT;
        uint bwrite = 0;
        var status = device.Write(buf, buf.Length, ref bwrite);
        if (status != FTDI.FT_STATUS.FT_OK)
        {
            return false;
        }
        writeState = UARTWritingState.free;
        return true;
    }

    private static int loadInt(byte[] arr, int index)
    {
        return (int)(arr[index] * 16777216 + arr[index + 1] * 65536 + arr[index + 2] * 256 + arr[index + 3]);
    }

    private static int saveInt(byte[] arr, int index, int value)
    {
        arr[index] = (byte)(value / 16777216);
        arr[index + 1] = (byte)(value / 65536);
        arr[index + 2] = (byte)(value / 256);
        arr[index + 3] = (byte)(value);
        return value;
    }

    public MotorState ConvertData(byte[] data)
    {
        if (data.Length >= 28)
        {
            MotorState obj = new MotorState();
            obj.command = data[0];
            obj.state = data[1];
            obj.line = (ushort)(data[2] * 256 + data[3]);
            obj.x = loadInt(data, 4);
            obj.y = loadInt(data, 8);
            obj.z = loadInt(data, 12);
            obj.xLimit = loadInt(data, 16);
            obj.yLimit = loadInt(data, 20);
            obj.zLimit = loadInt(data, 24);
            return obj;
        }
        return null;
    }

    public bool Send(MotorCommand data)
    {
        if (data == null)
        {
            return false;
        }
        byte[] bytes = new byte[18];
        bytes[0] = (byte)data.command;
        if (data.Speed.HasValue)
        {
            bytes[1] = (byte)(data.Speed.Value / 256);
            bytes[2] = (byte)(data.Speed % 256);
        }
        if (data.programLine.HasValue)
        {
            bytes[3] = (byte)(data.programLine.Value / 256);
            bytes[4] = (byte)(data.programLine % 256);
        }
        if (data.X.HasValue)
        {
            saveInt(bytes, 5, data.X.Value);
        }
        if (data.Y.HasValue)
        {
            saveInt(bytes, 9, data.Y.Value);
        }
        if (data.Z.HasValue)
        {
            saveInt(bytes, 13, data.Z.Value);
        }
        Send(bytes);
        return true;
    }
}
